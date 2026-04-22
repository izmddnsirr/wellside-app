"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { createAdminClient } from "@/utils/supabase/server";
import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "@/utils/email/booking-cancellation";
import {
  evaluateShopDateStatus,
  hasRestWindowOverlap,
  loadShopOperatingRules,
} from "@/utils/shop-operations";
import { sendPushToUser } from "@/utils/push";
import { allowedStatuses } from "./constants";

const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaHourMinuteFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "Asia/Kuala_Lumpur",
});

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const parseTimeToMinutes = (value: string | null) => {
  if (!value) {
    return null;
  }
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
};

const toMalaysiaDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return malaysiaDateKeyFormatter.format(date);
};

const toMinutesInMalaysia = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = malaysiaHourMinuteFormatter.formatToParts(date);
  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? "NaN",
  );
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "NaN",
  );
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return hour * 60 + minute;
};

const toWeekdayInMalaysia = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const weekday = malaysiaWeekdayFormatter.format(date).toLowerCase();
  return WEEKDAY_KEYS.includes(weekday as (typeof WEEKDAY_KEYS)[number])
    ? weekday
    : null;
};

const revalidateBookings = () => {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/active");
  revalidatePath("/admin/bookings/past");
  revalidatePath("/admin/bookings/calendar");
};

type BookingMutationResult = {
  ok: boolean;
  error?: string;
};

export const createBarberUnavailability = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const barberId = String(formData.get("barber_id") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const endAt = String(formData.get("end_at") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "");
  const reason = reasonRaw.trim();

  if (!barberId || !startAt || !endAt) {
    return { ok: false, error: "Missing unavailability details." } satisfies BookingMutationResult;
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return { ok: false, error: "Invalid unavailability time range." } satisfies BookingMutationResult;
  }

  const { data: overlappingBooking, error: overlapBookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", barberId)
    .in("status", ["scheduled", "in_progress"])
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1)
    .maybeSingle();

  if (overlapBookingError) {
    console.error(
      "Failed to validate booking overlap for unavailability",
      overlapBookingError,
    );
    return { ok: false, error: "Failed to validate overlapping bookings." } satisfies BookingMutationResult;
  }

  if (overlappingBooking) {
    return { ok: false, error: "This time already has a booking." } satisfies BookingMutationResult;
  }

  const { data: overlappingUnavailability, error: overlapUnavailabilityError } =
    await supabase
      .from("barber_unavailability")
      .select("id")
      .eq("barber_id", barberId)
      .lt("start_at", endAt)
      .gt("end_at", startAt)
      .limit(1)
      .maybeSingle();

  if (overlapUnavailabilityError) {
    console.error(
      "Failed to validate unavailability overlap",
      overlapUnavailabilityError,
    );
    return { ok: false, error: "Failed to validate unavailability overlap." } satisfies BookingMutationResult;
  }

  if (overlappingUnavailability) {
    return { ok: false, error: "This unavailability range already exists." } satisfies BookingMutationResult;
  }

  const { error } = await supabase.from("barber_unavailability").insert({
    barber_id: barberId,
    start_at: startAt,
    end_at: endAt,
    reason: reason || null,
  });

  if (error) {
    console.error("Failed to create barber unavailability", error);
    return { ok: false, error: "Failed to create unavailability." } satisfies BookingMutationResult;
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};

export const deleteBarberUnavailability = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const unavailabilityId = String(formData.get("unavailability_id") ?? "");

  if (!unavailabilityId) {
    return { ok: false, error: "Missing unavailability id." } satisfies BookingMutationResult;
  }

  const { error } = await supabase
    .from("barber_unavailability")
    .delete()
    .eq("id", unavailabilityId);

  if (error) {
    console.error("Failed to delete barber unavailability", error);
    return { ok: false, error: "Failed to delete unavailability." } satisfies BookingMutationResult;
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};

export const createBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const walkInName = String(formData.get("customer_name") ?? "").trim();
  const walkInPhone = String(formData.get("customer_phone") ?? "").trim();
  const barberId = String(formData.get("barber_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const endAt = String(formData.get("end_at") ?? "");

  if (!barberId || !serviceId || !startAt || !endAt) {
    return { ok: false, error: "Missing booking details." } satisfies BookingMutationResult;
  }

  const resolvedCustomerId: string | null = customerId || null;
  let walkInCustomerId: string | null = null;

  if (!resolvedCustomerId) {
    if (!walkInName || !walkInPhone) {
      return { ok: false, error: "Select existing customer or provide walk-in name and phone." } satisfies BookingMutationResult;
    }

    const { data: existingWalkIn, error: walkInLookupError } = await supabase
      .from("walk_in_customers")
      .select("id")
      .eq("phone", walkInPhone)
      .limit(1)
      .maybeSingle();

    if (walkInLookupError) {
      console.error("Failed to lookup walk-in customer", walkInLookupError);
      return { ok: false, error: "Failed to lookup walk-in customer." } satisfies BookingMutationResult;
    }

    if (existingWalkIn?.id) {
      walkInCustomerId = existingWalkIn.id;
    } else {
      const { data: createdWalkIn, error: createWalkInError } = await supabase
        .from("walk_in_customers")
        .insert({
          name: walkInName,
          phone: walkInPhone,
        })
        .select("id")
        .single();

      if (createWalkInError || !createdWalkIn?.id) {
        console.error("Failed to create walk-in customer", createWalkInError);
        return { ok: false, error: "Failed to create walk-in customer." } satisfies BookingMutationResult;
      }

      walkInCustomerId = createdWalkIn.id;
    }
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return { ok: false, error: "Invalid booking time range." } satisfies BookingMutationResult;
  }

  const operatingRules = await loadShopOperatingRules(createAdminAuthClient());
  const shopStatus = evaluateShopDateStatus(
    startAt,
    operatingRules.weeklySchedule,
    operatingRules.temporaryClosures,
  );

  if (shopStatus.closed) {
    return { ok: false, error: "Shop is closed for the selected date." } satisfies BookingMutationResult;
  }

  if (
    hasRestWindowOverlap(startAt, endAt, operatingRules.restWindows)
  ) {
    return { ok: false, error: "Selected time overlaps rest time." } satisfies BookingMutationResult;
  }

  const { data: barberProfile, error: barberError } = await supabase
    .from("profiles")
    .select("working_start_time, working_end_time, off_days")
    .eq("id", barberId)
    .single();

  if (barberError || !barberProfile) {
    console.error("Failed to load barber profile for booking", barberError);
    return { ok: false, error: "Failed to load barber profile." } satisfies BookingMutationResult;
  }

  const workingStartMinutes = parseTimeToMinutes(
    barberProfile.working_start_time,
  );
  const rawWorkingEndMinutes = parseTimeToMinutes(
    barberProfile.working_end_time,
  );
  const bookingStartMinutes = toMinutesInMalaysia(startAt);
  const rawBookingEndMinutes = toMinutesInMalaysia(endAt);
  const bookingWeekday = toWeekdayInMalaysia(startAt);
  const offDays = Array.isArray(barberProfile.off_days)
    ? barberProfile.off_days.map((value: string) => value.toLowerCase())
    : [];
  const bookingStartDateKey = toMalaysiaDateKey(startAt);
  const bookingEndDateKey = toMalaysiaDateKey(endAt);

  const workingEndMinutes =
    workingStartMinutes !== null && rawWorkingEndMinutes !== null
      ? rawWorkingEndMinutes <= workingStartMinutes
        ? rawWorkingEndMinutes + 24 * 60
        : rawWorkingEndMinutes
      : null;

  const bookingEndMinutes =
    bookingStartMinutes !== null && rawBookingEndMinutes !== null
      ? bookingEndDateKey !== bookingStartDateKey ||
        rawBookingEndMinutes <= bookingStartMinutes
        ? rawBookingEndMinutes + 24 * 60
        : rawBookingEndMinutes
      : null;

  if (
    workingStartMinutes === null ||
    workingEndMinutes === null ||
    bookingStartMinutes === null ||
    bookingEndMinutes === null ||
    (bookingWeekday !== null && offDays.includes(bookingWeekday)) ||
    bookingStartMinutes < workingStartMinutes ||
    bookingEndMinutes > workingEndMinutes
  ) {
    return { ok: false, error: "Selected time is outside barber working hours." } satisfies BookingMutationResult;
  }

  const { data: overlappingBooking, error: overlapError } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", barberId)
    .in("status", ["scheduled", "in_progress"])
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1)
    .maybeSingle();

  if (overlapError) {
    console.error("Failed to validate booking overlap", overlapError);
    return { ok: false, error: "Failed to validate booking overlap." } satisfies BookingMutationResult;
  }

  if (overlappingBooking) {
    return { ok: false, error: "Selected slot is no longer available." } satisfies BookingMutationResult;
  }

  const { data: overlappingUnavailability, error: unavailabilityError } =
    await supabase
      .from("barber_unavailability")
      .select("id")
      .eq("barber_id", barberId)
      .lt("start_at", endAt)
      .gt("end_at", startAt)
      .limit(1)
      .maybeSingle();

  if (unavailabilityError) {
    console.error(
      "Failed to validate barber unavailability overlap",
      unavailabilityError,
    );
    return { ok: false, error: "Failed to validate barber availability." } satisfies BookingMutationResult;
  }

  if (overlappingUnavailability) {
    return { ok: false, error: "Selected slot is marked unavailable." } satisfies BookingMutationResult;
  }

  const { error } = await supabase.from("bookings").insert({
    customer_id: resolvedCustomerId,
    walk_in_customer_id: walkInCustomerId,
    walk_in_name: walkInName ?? null,
    barber_id: barberId,
    service_id: serviceId,
    start_at: startAt,
    end_at: endAt,
    status: "scheduled",
  });

  if (error) {
    console.error("Failed to create booking", error);
    return { ok: false, error: "Failed to create booking." } satisfies BookingMutationResult;
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};

export const updateBookingStatus = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (
    !id ||
    !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
  ) {
    return { ok: false, error: "Invalid booking status update." } satisfies BookingMutationResult;
  }

  const bookingDetails =
    status === "cancelled"
      ? (
          await supabase
            .from("bookings")
            .select(
              `
              id,
              customer_id,
              booking_ref,
              start_at,
              end_at,
              booking_date,
              customer:customer_id (first_name, last_name, email, phone),
              barber:barber_id (display_name, first_name, last_name),
              service:service_id (name, base_price)
            `,
            )
            .eq("id", id)
            .single()
        ).data
      : null;

  // For non-cancel statuses, fetch customer_id for push notification
  const customerId: string | null =
    bookingDetails?.customer_id ??
    (await supabase
      .from("bookings")
      .select("customer_id")
      .eq("id", id)
      .single()
      .then(({ data }) => data?.customer_id ?? null));

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return { ok: false, error: "Failed to update booking status." } satisfies BookingMutationResult;
  }

  // Push notification based on new status
  if (customerId) {
    const pushMessages: Record<string, { title: string; body: string }> = {
      in_progress: {
        title: "Your appointment has started",
        body: "Head over — your barber is ready for you.",
      },
      completed: {
        title: "All done!",
        body: "Thanks for visiting Wellside. See you next time.",
      },
      cancelled: {
        title: "Booking cancelled",
        body: "Your booking has been cancelled by the shop.",
      },
    };

    const msg = pushMessages[status];
    if (msg) {
      void sendPushToUser(customerId, msg.title, msg.body, { bookingId: id, status });
    }
  }

  if (status === "cancelled" && bookingDetails) {
    try {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId: id,
        });
      } else {
        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        sendOps.push(
          sendBookingCancellationEmailTo(
            payload,
            payload.customerEmail,
            "Customer",
          ),
        );

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingCancellationEmailTo(payload, adminEmails, "Admin"),
          );
        } else {
          console.error("Missing admin emails for booking cancellation");
        }

        await Promise.allSettled(sendOps);
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};

export const cancelBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, error: "Missing booking id." } satisfies BookingMutationResult;
  }

  const { data: bookingDetails } = await supabase
    .from("bookings")
    .select(
      `
      id,
      customer_id,
      booking_ref,
      start_at,
      end_at,
      booking_date,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (display_name, first_name, last_name),
      service:service_id (name, base_price)
    `,
    )
    .eq("id", id)
    .single();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: "cancelled",
  });

  if (error) {
    console.error("Failed to cancel booking", error);
    return { ok: false, error: "Failed to cancel booking." } satisfies BookingMutationResult;
  }

  if (bookingDetails) {
    // Push notification to customer
    if (bookingDetails.customer_id) {
      void sendPushToUser(
        bookingDetails.customer_id,
        "Booking cancelled",
        "Your booking has been cancelled by the shop.",
        { bookingId: id, status: "cancelled" },
      );
    }

    try {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId: id,
        });
      } else {
        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        sendOps.push(
          sendBookingCancellationEmailTo(
            payload,
            payload.customerEmail,
            "Customer",
          ),
        );

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingCancellationEmailTo(payload, adminEmails, "Admin"),
          );
        } else {
          console.error("Missing admin emails for booking cancellation");
        }

        await Promise.allSettled(sendOps);
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};

export const deleteBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { ok: false, error: "Missing booking id." } satisfies BookingMutationResult;
  }

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete booking", error);
    return { ok: false, error: "Failed to delete booking." } satisfies BookingMutationResult;
  }

  revalidateBookings();
  return { ok: true } satisfies BookingMutationResult;
};
