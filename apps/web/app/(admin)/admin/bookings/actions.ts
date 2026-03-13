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
  loadShopOperatingRules,
} from "@/utils/shop-operations";
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

const revalidateBookings = () => {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/active");
  revalidatePath("/admin/bookings/past");
  revalidatePath("/admin/bookings/calendar");
};

export const createBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const customerId = String(formData.get("customer_id") ?? "");
  const barberId = String(formData.get("barber_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const endAt = String(formData.get("end_at") ?? "");

  if (!customerId || !barberId || !serviceId || !startAt || !endAt) {
    return;
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return;
  }

  const operatingRules = await loadShopOperatingRules(createAdminAuthClient());
  const shopStatus = evaluateShopDateStatus(
    startAt,
    operatingRules.weeklySchedule,
    operatingRules.temporaryClosures,
  );

  if (shopStatus.closed) {
    return;
  }

  const { data: barberProfile, error: barberError } = await supabase
    .from("profiles")
    .select("working_start_time, working_end_time")
    .eq("id", barberId)
    .single();

  if (barberError || !barberProfile) {
    console.error("Failed to load barber profile for booking", barberError);
    return;
  }

  const workingStartMinutes = parseTimeToMinutes(
    barberProfile.working_start_time,
  );
  const workingEndMinutes = parseTimeToMinutes(barberProfile.working_end_time);
  const bookingStartMinutes = toMinutesInMalaysia(startAt);
  const bookingEndMinutes = toMinutesInMalaysia(endAt);

  const sameMalaysiaDay =
    toMalaysiaDateKey(startAt) === toMalaysiaDateKey(endAt);

  if (
    !sameMalaysiaDay ||
    workingStartMinutes === null ||
    workingEndMinutes === null ||
    bookingStartMinutes === null ||
    bookingEndMinutes === null ||
    bookingStartMinutes < workingStartMinutes ||
    bookingEndMinutes > workingEndMinutes
  ) {
    return;
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
    return;
  }

  if (overlappingBooking) {
    return;
  }

  const { error } = await supabase.from("bookings").insert({
    customer_id: customerId,
    barber_id: barberId,
    service_id: serviceId,
    start_at: startAt,
    end_at: endAt,
    status: "scheduled",
  });

  if (error) {
    console.error("Failed to create booking", error);
    return;
  }

  revalidateBookings();
};

export const updateBookingStatus = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (
    !id ||
    !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
  ) {
    return;
  }

  const bookingDetails =
    status === "cancelled"
      ? (
          await supabase
            .from("bookings")
            .select(
              `
              id,
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

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return;
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
};

export const cancelBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { data: bookingDetails } = await supabase
    .from("bookings")
    .select(
      `
      id,
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
    return;
  }

  if (bookingDetails) {
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
};

export const deleteBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete booking", error);
    return;
  }

  revalidateBookings();
};
