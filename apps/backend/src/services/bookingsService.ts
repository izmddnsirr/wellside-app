import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "../lib/email/booking-cancellation";
import {
  buildBookingConfirmationPayload,
  sendBookingConfirmationEmailTo,
} from "../lib/email/booking-confirmation";
import {
  evaluateShopDateStatus,
  loadShopOperatingRules,
} from "../lib/shop-operations";
import { createAdminClient } from "../lib/supabase";
import type { BookingStatus } from "../types/booking";

export const allowedStatuses: BookingStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
];

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

async function sendAdminCancellationEmails(payload: ReturnType<typeof buildBookingCancellationPayload>) {
  if (!payload) {
    return;
  }

  const supabase = createAdminClient();
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
    sendBookingCancellationEmailTo(payload, payload.customerEmail, "Customer"),
  );

  if (adminEmails.length > 0) {
    sendOps.push(sendBookingCancellationEmailTo(payload, adminEmails, "Admin"));
  } else {
    console.error("Missing admin emails for booking cancellation");
  }

  await Promise.allSettled(sendOps);
}

export async function createCustomerBooking(input: {
  customerId: string;
  barberId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
}) {
  const supabase = createAdminClient();
  const { customerId, barberId, serviceId, startAt, endAt } = input;

  if (!customerId || !barberId || !serviceId || !startAt || !endAt) {
    throw new Error("Missing required fields.");
  }

  const { data: existingBooking, error: existingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_id", customerId)
    .in("status", ["scheduled", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to validate existing booking.");
  }

  if (existingBooking) {
    throw new Error("Customer already has an active booking.");
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Invalid booking range.");
  }

  const operatingRules = await loadShopOperatingRules(createAdminClient());
  const shopStatus = evaluateShopDateStatus(
    startAt,
    operatingRules.weeklySchedule,
    operatingRules.temporaryClosures,
  );

  if (shopStatus.closed) {
    throw new Error("Shop is closed.");
  }

  const { data: barberProfile, error: barberError } = await supabase
    .from("profiles")
    .select("working_start_time, working_end_time")
    .eq("id", barberId)
    .single();

  if (barberError || !barberProfile) {
    throw new Error("Unable to load barber working hours.");
  }

  const workingStartMinutes = parseTimeToMinutes(
    barberProfile?.working_start_time ?? null,
  );
  const workingEndMinutes = parseTimeToMinutes(
    barberProfile?.working_end_time ?? null,
  );
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
    throw new Error("Booking is outside barber working hours.");
  }

  const { data: overlappingBooking, error: overlapError } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1)
    .maybeSingle();

  if (overlapError) {
    throw new Error("Unable to validate booking overlap.");
  }

  if (overlappingBooking) {
    throw new Error("Booking overlaps an existing booking.");
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: customerId,
      barber_id: barberId,
      service_id: serviceId,
      start_at: startAt,
      end_at: endAt,
      status: "scheduled",
    })
    .select("id")
    .single();

  const bookingId = data?.id;

  if (error || !bookingId) {
    throw new Error("Unable to create booking.");
  }

  try {
    const { data: bookingDetails, error: bookingDetailsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        booking_ref,
        status,
        start_at,
        end_at,
        booking_date,
        customer:customer_id (first_name, last_name, email, phone),
        barber:barber_id (display_name, first_name, last_name),
        service:service_id (name, base_price)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingDetailsError || !bookingDetails) {
      console.error("Failed to load booking details for email", {
        bookingId,
        bookingDetailsError,
      });
    } else {
      const { payload, customerEmail } =
        buildBookingConfirmationPayload(bookingDetails);

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
      if (customerEmail) {
        sendOps.push(
          sendBookingConfirmationEmailTo(payload, customerEmail, "Customer"),
        );
      } else {
        console.error("Missing customer email for booking confirmation", {
          bookingId,
        });
      }

      if (adminEmails.length > 0) {
        sendOps.push(
          sendBookingConfirmationEmailTo(payload, adminEmails, "Admin"),
        );
      } else {
        console.error("Missing admin emails for booking confirmation");
      }

      await Promise.allSettled(sendOps);
    }
  } catch (emailError) {
    console.error("Failed to send booking confirmation email", emailError);
  }

  return { bookingId };
}

export async function createAdminBooking(input: {
  customerId: string;
  barberId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
}) {
  const supabase = createAdminClient();
  const { customerId, barberId, serviceId, startAt, endAt } = input;

  if (!customerId || !barberId || !serviceId || !startAt || !endAt) {
    throw new Error("Missing required fields.");
  }

  const startMs = new Date(startAt).getTime();
  const endMs = new Date(endAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Invalid booking range.");
  }

  const operatingRules = await loadShopOperatingRules(createAdminClient());
  const shopStatus = evaluateShopDateStatus(
    startAt,
    operatingRules.weeklySchedule,
    operatingRules.temporaryClosures,
  );

  if (shopStatus.closed) {
    throw new Error("Shop is closed.");
  }

  const { data: barberProfile, error: barberError } = await supabase
    .from("profiles")
    .select("working_start_time, working_end_time")
    .eq("id", barberId)
    .single();

  if (barberError || !barberProfile) {
    throw new Error("Unable to load barber profile for booking.");
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
    throw new Error("Booking is outside barber working hours.");
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
    throw new Error("Failed to validate booking overlap.");
  }

  if (overlappingBooking) {
    throw new Error("Booking overlaps an existing booking.");
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: customerId,
      barber_id: barberId,
      service_id: serviceId,
      start_at: startAt,
      end_at: endAt,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("Failed to create booking.");
  }

  return { bookingId: data.id };
}

export async function cancelCustomerBooking(bookingId: string) {
  const supabase = createAdminClient();

  if (!bookingId) {
    throw new Error("Missing booking id.");
  }

  const { data: bookingDetails, error: bookingDetailsError } = await supabase
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
    .eq("id", bookingId)
    .single();
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    throw new Error("Unable to cancel booking.");
  }

  try {
    if (bookingDetailsError || !bookingDetails) {
      console.error("Failed to load booking details for cancellation email", {
        bookingId,
        bookingDetailsError,
      });
    } else {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId,
        });
      } else {
        await sendAdminCancellationEmails(payload);
      }
    }
  } catch (emailError) {
    console.error("Failed to send booking cancellation email", emailError);
  }

  return { ok: true };
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const supabase = createAdminClient();
  if (!bookingId || !allowedStatuses.includes(status)) {
    throw new Error("Invalid booking status request.");
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
            .eq("id", bookingId)
            .single()
        ).data
      : null;

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_status: status,
  });

  if (error) {
    throw new Error("Failed to update booking status.");
  }

  if (status === "cancelled" && bookingDetails) {
    try {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId,
        });
      } else {
        await sendAdminCancellationEmails(payload);
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  return { ok: true };
}

export async function updateBarberBookingStatus(input: {
  bookingId: string;
  barberId: string;
  status: BookingStatus;
}) {
  const supabase = createAdminClient();
  const { bookingId, barberId, status } = input;

  if (!bookingId || !barberId || !allowedStatuses.includes(status)) {
    throw new Error("Invalid booking status request.");
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      id,
      barber_id,
      booking_ref,
      start_at,
      end_at,
      booking_date,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (display_name, first_name, last_name),
      service:service_id (name, base_price)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.barber_id !== barberId) {
    throw new Error("Booking not found for barber.");
  }

  const { error } = await supabase.rpc("barber_update_booking_status", {
    p_booking_id: bookingId,
    p_status: status,
  });

  if (error) {
    throw new Error("Failed to update booking status.");
  }

  if (status === "cancelled") {
    try {
      const payload = buildBookingCancellationPayload(booking);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId,
        });
      } else {
        await sendBookingCancellationEmailTo(
          payload,
          payload.customerEmail,
          "Customer",
        );
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  return { ok: true };
}
