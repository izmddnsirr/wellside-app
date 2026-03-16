import {
  formatMalaysiaDateTime,
  getMalaysiaNow,
  type MalaysiaWeekdayKey,
  toMalaysiaWeekdayKey,
} from "../time/malaysia";

export type TimeRange = {
  start: Date;
  end: Date;
};

export type Slot = {
  label: string;
  start_at: string;
  end_at: string;
};

export const SLOT_HOURS = 1;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function normalizeWorkEnd(workStart: Date, workEnd: Date) {
  if (workEnd <= workStart) {
    return addHours(workEnd, 24);
  }
  return workEnd;
}

export function buildRestRanges(
  dateISO: string,
  restWindows: Array<{ start_time: string; end_time: string }>,
) {
  const output: TimeRange[] = [];
  const offsets = [-24, 0, 24];

  restWindows.forEach((window) => {
    const baseStart = formatMalaysiaDateTime(dateISO, window.start_time);
    const baseEnd = normalizeWorkEnd(
      baseStart,
      formatMalaysiaDateTime(dateISO, window.end_time),
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

export function isOffDay(offDays: string[] | null | undefined, dateISO: string) {
  const weekday = toMalaysiaWeekdayKey(dateISO);
  if (!weekday || !Array.isArray(offDays)) {
    return false;
  }
  const normalized = offDays.map((value) => value.toLowerCase());
  return normalized.includes(weekday);
}

export function getSlotsFromRanges(input: {
  dateISO: string;
  workingStartTime: string;
  workingEndTime: string;
  bookedRanges?: TimeRange[];
  blockedRanges?: TimeRange[];
  restRanges?: TimeRange[];
  now?: Date;
}) {
  const {
    dateISO,
    workingStartTime,
    workingEndTime,
    bookedRanges = [],
    blockedRanges = [],
    restRanges = [],
    now = getMalaysiaNow(),
  } = input;

  const workStart = formatMalaysiaDateTime(dateISO, workingStartTime);
  const workEnd = normalizeWorkEnd(
    workStart,
    formatMalaysiaDateTime(dateISO, workingEndTime),
  );

  const slots: Slot[] = [];

  for (
    let t = new Date(workStart);
    addHours(t, SLOT_HOURS) <= workEnd;
    t = addHours(t, SLOT_HOURS)
  ) {
    const slotStart = t;
    const slotEnd = addHours(t, SLOT_HOURS);

    if (
      restRanges.some((range) =>
        overlaps(slotStart, slotEnd, range.start, range.end),
      )
    ) {
      continue;
    }

    if (
      bookedRanges.some((range) =>
        overlaps(slotStart, slotEnd, range.start, range.end),
      )
    ) {
      continue;
    }

    if (
      blockedRanges.some((range) =>
        overlaps(slotStart, slotEnd, range.start, range.end),
      )
    ) {
      continue;
    }

    if (slotStart <= now) {
      continue;
    }

    slots.push({
      label: timeFormatter.format(slotStart),
      start_at: slotStart.toISOString(),
      end_at: slotEnd.toISOString(),
    });
  }

  return slots;
}

export type { MalaysiaWeekdayKey };
