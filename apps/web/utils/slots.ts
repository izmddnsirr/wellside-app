import { createClient } from "@/utils/supabase/client";
import {
  evaluateShopDateStatus,
  loadShopOperatingRules,
  type RestWindow,
} from "@/utils/shop-operations";

type BookingRow = {
  start_at: string;
  end_at: string;
};

type UnavailabilityRow = {
  start_at: string;
  end_at: string;
};

type Slot = {
  label: string;
  start_at: string;
  end_at: string;
};

const SLOT_HOURS = 1;
const TIME_ZONE = "Asia/Kuala_Lumpur";
const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function addHours(d: Date, hrs: number) {
  return new Date(d.getTime() + hrs * 60 * 60 * 1000);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function fmtHHmm(d: Date) {
  return timeFormatter.format(d);
}

function toMYDateTime(dateISO: string, time: string) {
  return new Date(`${dateISO}T${time}+08:00`);
}

function normalizeWorkEnd(workStart: Date, workEnd: Date) {
  if (workEnd <= workStart) {
    return addHours(workEnd, 24);
  }
  return workEnd;
}

function buildRestRanges(dateISO: string, restWindows: RestWindow[]) {
  const output: Array<{ start: Date; end: Date }> = [];
  const offsets = [-24, 0, 24];

  restWindows.forEach((window) => {
    const baseStart = toMYDateTime(dateISO, window.start_time);
    const baseEnd = normalizeWorkEnd(
      baseStart,
      toMYDateTime(dateISO, window.end_time),
    );

    offsets.forEach((offsetHours) => {
      const start = addHours(baseStart, offsetHours);
      const end = addHours(baseEnd, offsetHours);
      if (end > start) {
        output.push({ start, end });
      }
    });
  });

  return output;
}

function toMYWeekdayKey(dateISO: string) {
  const date = toMYDateTime(dateISO, "00:00:00");
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
  return WEEKDAY_KEYS.includes(weekday as (typeof WEEKDAY_KEYS)[number])
    ? weekday
    : null;
}

function getMyNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const dateISO = `${get("year")}-${get("month")}-${get("day")}`;
  const time = `${get("hour")}:${get("minute")}:${get("second")}`;
  return toMYDateTime(dateISO, time);
}

export async function getAvailableSlots(
  barberId: string,
  dateISO: string,
): Promise<Slot[]> {
  if (!barberId || !dateISO) {
    return [];
  }

  const nowMY = getMyNow();
  const supabase = createClient();
  const rules = await loadShopOperatingRules(supabase);
  const status = evaluateShopDateStatus(
    dateISO,
    rules.weeklySchedule,
    rules.temporaryClosures,
  );
  if (status.closed) {
    return [];
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("working_start_time,working_end_time,off_days")
    .eq("id", barberId)
    .single();

  if (profileError || !profile) {
    throw new Error("Unable to load barber working hours.");
  }

  const weekdayKey = toMYWeekdayKey(dateISO);
  const offDays = Array.isArray(profile.off_days)
    ? profile.off_days.map((value: string) => value.toLowerCase())
    : [];
  if (weekdayKey && offDays.includes(weekdayKey)) {
    return [];
  }

  const workStart = toMYDateTime(dateISO, profile.working_start_time);
  const workEnd = normalizeWorkEnd(
    workStart,
    toMYDateTime(dateISO, profile.working_end_time),
  );
  const restRanges = buildRestRanges(dateISO, rules.restWindows);

  const dayStart = toMYDateTime(dateISO, "00:00:00");
  const dayEnd = addHours(dayStart, 24);
  const queryEnd = workEnd > dayEnd ? workEnd : dayEnd;

  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select("start_at,end_at")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .lt("start_at", queryEnd.toISOString())
    .gt("end_at", dayStart.toISOString());

  if (bookingError) {
    throw new Error("Unable to load barber bookings.");
  }

  const { data: unavailabilityRows, error: unavailabilityError } =
    await supabase
      .from("barber_unavailability")
      .select("start_at,end_at")
      .eq("barber_id", barberId)
      .lt("start_at", queryEnd.toISOString())
      .gt("end_at", dayStart.toISOString());

  if (unavailabilityError) {
    throw new Error("Unable to load barber unavailability.");
  }

  const bookedRanges =
    bookings?.map((b: BookingRow) => ({
      start: new Date(b.start_at),
      end: new Date(b.end_at),
    })) ?? [];
  const blockedRanges =
    unavailabilityRows?.map((row: UnavailabilityRow) => ({
      start: new Date(row.start_at),
      end: new Date(row.end_at),
    })) ?? [];

  const slots: Slot[] = [];

  for (
    let t = new Date(workStart);
    addHours(t, SLOT_HOURS) <= workEnd;
    t = addHours(t, SLOT_HOURS)
  ) {
    const slotStart = t;
    const slotEnd = addHours(t, SLOT_HOURS);

    const restClash = restRanges.some((range) =>
      overlaps(slotStart, slotEnd, range.start, range.end),
    );
    if (restClash) {
      continue;
    }

    const clash = bookedRanges.some((br) =>
      overlaps(slotStart, slotEnd, br.start, br.end),
    );
    if (clash) {
      continue;
    }

    const blocked = blockedRanges.some((br) =>
      overlaps(slotStart, slotEnd, br.start, br.end),
    );
    if (blocked) {
      continue;
    }

    if (slotStart <= nowMY) {
      continue;
    }

    slots.push({
      label: fmtHHmm(slotStart),
      start_at: slotStart.toISOString(),
      end_at: slotEnd.toISOString(),
    });
  }

  return slots;
}

export type { Slot };
