import "server-only";

import { createClient } from "@/utils/supabase/server";

type BookingRow = {
  start_at: string;
  end_at: string;
};

type Slot = {
  label: string;
  start_at: string;
  end_at: string;
};

const SLOT_HOURS = 1;
const BREAK_START = "19:00:00";
const BREAK_END = "20:00:00";
const TIME_ZONE = "Asia/Kuala_Lumpur";

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
  dateISO: string
): Promise<Slot[]> {
  if (!barberId || !dateISO) {
    return [];
  }

  const nowMY = getMyNow();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("working_start_time,working_end_time")
    .eq("id", barberId)
    .single();

  if (profileError || !profile) {
    throw new Error("Unable to load barber working hours.");
  }

  const workStart = toMYDateTime(dateISO, profile.working_start_time);
  const workEnd = toMYDateTime(dateISO, profile.working_end_time);
  const breakStart = toMYDateTime(dateISO, BREAK_START);
  const breakEnd = toMYDateTime(dateISO, BREAK_END);

  const dayStart = toMYDateTime(dateISO, "00:00:00");
  const dayEnd = addHours(dayStart, 24);

  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select("start_at,end_at")
    .eq("barber_id", barberId)
    .neq("status", "cancelled")
    .lt("start_at", dayEnd.toISOString())
    .gt("end_at", dayStart.toISOString());

  if (bookingError) {
    throw new Error("Unable to load barber bookings.");
  }

  const bookedRanges =
    bookings?.map((b: BookingRow) => ({
      start: new Date(b.start_at),
      end: new Date(b.end_at),
    })) ?? [];

  const slots: Slot[] = [];

  for (
    let t = new Date(workStart);
    addHours(t, SLOT_HOURS) <= workEnd;
    t = addHours(t, SLOT_HOURS)
  ) {
    const slotStart = t;
    const slotEnd = addHours(t, SLOT_HOURS);

    if (overlaps(slotStart, slotEnd, breakStart, breakEnd)) {
      continue;
    }

    const clash = bookedRanges.some((br) =>
      overlaps(slotStart, slotEnd, br.start, br.end)
    );
    if (clash) {
      continue;
    }

    if (slotStart <= nowMY) {
      continue;
    }

    slots.push({
      label: `${fmtHHmm(slotStart)} - ${fmtHHmm(slotEnd)}`,
      start_at: slotStart.toISOString(),
      end_at: slotEnd.toISOString(),
    });
  }

  return slots;
}

export type { Slot };
