import { redirect } from "next/navigation";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  buildBookingConfirmationPayload,
  sendBookingConfirmationEmailTo,
} from "@/utils/email/booking-confirmation";
import {
  evaluateShopDateStatus,
  hasRestWindowOverlap,
  loadShopOperatingRules,
} from "@/utils/shop-operations";
import { ConfirmingBookingClient } from "./confirming-booking-client";

type BookingSearchParams = {
  service?: string | string[];
  duration?: string | string[];
  price?: string | string[];
  total?: string | string[];
  date?: string | string[];
  time?: string | string[];
  barber?: string | string[];
  barberId?: string | string[];
  serviceId?: string | string[];
  startAt?: string | string[];
  endAt?: string | string[];
  startedAt?: string | string[];
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

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

export default async function ConfirmingBookingPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const serviceId = readParam(params.serviceId) ?? "";
  const barberId = readParam(params.barberId) ?? "";
  const startAt = readParam(params.startAt) ?? "";
  const endAt = readParam(params.endAt) ?? "";

  const startedAtParam = readParam(params.startedAt);
  const startedAt =
    startedAtParam && !Number.isNaN(Number(startedAtParam))
      ? Number(startedAtParam)
      : 0;

  const baseParams = {
    service: readParam(params.service) ?? "",
    duration: readParam(params.duration) ?? "",
    price: readParam(params.price) ?? "",
    total: readParam(params.total) ?? "",
    date: readParam(params.date) ?? "",
    time: readParam(params.time) ?? "",
    barber: readParam(params.barber) ?? "",
    barberId,
    serviceId,
    startAt,
    endAt,
  };
  const returnParams = new URLSearchParams(baseParams);
  const returnHref = `/booking/review?${returnParams.toString()}`;
  if (!serviceId || !barberId || !startAt || !endAt) {
    redirect(returnHref);
  }

  const confirmBooking = async () => {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const redirectWithError = (code: "booking" | "active"): never => {
      const query = new URLSearchParams({
        ...baseParams,
        error: code,
      });
      redirect(`/booking/review?${query.toString()}`);
    };

    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .limit(1)
      .maybeSingle();

    if (existingError) {
      redirectWithError("booking");
    }

    if (existingBooking) {
      redirectWithError("active");
    }

    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      redirectWithError("booking");
    }

    const operatingRules = await loadShopOperatingRules(
      createAdminAuthClient(),
    );
    const shopStatus = evaluateShopDateStatus(
      startAt,
      operatingRules.weeklySchedule,
      operatingRules.temporaryClosures,
    );

    if (shopStatus.closed) {
      redirectWithError("booking");
    }

    if (
      hasRestWindowOverlap(startAt, endAt, operatingRules.restWindows)
    ) {
      redirectWithError("booking");
    }

    const { data: barberProfile, error: barberError } = await supabase
      .from("profiles")
      .select("working_start_time, working_end_time, off_days")
      .eq("id", barberId)
      .single();

    if (barberError || !barberProfile) {
      redirectWithError("booking");
    }

    const workingStartMinutes = parseTimeToMinutes(
      barberProfile?.working_start_time ?? null,
    );
    const rawWorkingEndMinutes = parseTimeToMinutes(
      barberProfile?.working_end_time ?? null,
    );
    const bookingStartMinutes = toMinutesInMalaysia(startAt);
    const rawBookingEndMinutes = toMinutesInMalaysia(endAt);
    const bookingWeekday = toWeekdayInMalaysia(startAt);
    const offDays = Array.isArray(barberProfile?.off_days)
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
      redirectWithError("booking");
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
      redirectWithError("booking");
    }

    if (overlappingBooking) {
      redirectWithError("booking");
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
      redirectWithError("booking");
    }

    if (overlappingUnavailability) {
      redirectWithError("booking");
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
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
      redirectWithError("booking");
    }

    try {
      const { data: bookingDetails, error: bookingDetailsError } =
        await supabase
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

    redirect(`/booking/confirmed?bookingId=${bookingId}`);
  };

  return (
    <ConfirmingBookingClient
      startedAt={startedAt}
      returnHref={returnHref}
      confirmAction={confirmBooking}
    />
  );
}
