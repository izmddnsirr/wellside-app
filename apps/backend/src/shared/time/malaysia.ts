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

export type MalaysiaWeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function formatMalaysiaDateTime(dateISO: string, time: string) {
  return new Date(`${dateISO}T${time}+08:00`);
}

export function toMalaysiaWeekdayKey(dateISO: string): MalaysiaWeekdayKey | null {
  const date = formatMalaysiaDateTime(dateISO, "00:00:00");
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();

  return WEEKDAY_KEYS.includes(weekday as MalaysiaWeekdayKey)
    ? (weekday as MalaysiaWeekdayKey)
    : null;
}

export function getMalaysiaNow() {
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

  return formatMalaysiaDateTime(dateISO, time);
}
