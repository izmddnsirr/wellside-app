import type { TemporaryClosure, WeeklySchedule } from "../types/booking";

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAY_KEYS: WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

const malaysiaDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "Asia/Kuala_Lumpur",
});

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toMalaysiaDateISO = (value: string | Date) => {
  if (typeof value === "string" && isIsoDate(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = malaysiaDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
};

const toWeekdayKey = (value: string | Date): WeekdayKey | null => {
  const normalized = toMalaysiaDateISO(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const weekday = malaysiaWeekdayFormatter.format(date).toLowerCase();
  if (WEEKDAY_KEYS.includes(weekday as WeekdayKey)) {
    return weekday as WeekdayKey;
  }
  return null;
};

const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: string }).code;
  return maybeCode === "42P01";
};

export const normalizeWeeklySchedule = (
  value?: Partial<Record<WeekdayKey, boolean>>,
): WeeklySchedule => ({
  ...DEFAULT_WEEKLY_SCHEDULE,
  ...(value ?? {}),
});

export const evaluateShopDateStatus = (
  dateISO: string,
  weeklySchedule: WeeklySchedule,
  closures: TemporaryClosure[],
) => {
  const normalizedDate = toMalaysiaDateISO(dateISO);
  if (!normalizedDate) {
    return {
      closed: false,
      reason: null as string | null,
      source: null as "temporary" | "weekly" | null,
    };
  }

  const temporaryClosure = closures.find(
    (closure) =>
      closure.start_date <= normalizedDate &&
      normalizedDate <= closure.end_date,
  );

  if (temporaryClosure) {
    return {
      closed: true,
      reason: temporaryClosure.reason || "Temporary closure",
      source: "temporary" as const,
    };
  }

  const weekday = toWeekdayKey(normalizedDate);
  const isOpen = weekday ? weeklySchedule[weekday] : true;
  if (!isOpen) {
    return {
      closed: true,
      reason: "Closed (weekly schedule)",
      source: "weekly" as const,
    };
  }

  return {
    closed: false,
    reason: null as string | null,
    source: null as "temporary" | "weekly" | null,
  };
};

export const buildDateRange = (fromISO: string, toISO: string) => {
  const from = new Date(`${fromISO}T00:00:00+08:00`);
  const to = new Date(`${toISO}T00:00:00+08:00`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [] as string[];
  }

  const output: string[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    output.push(toMalaysiaDateISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return output;
};

export async function loadWeeklySchedule(supabase: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: unknown,
      ) => Promise<{
        data: Array<{ weekday: string; is_open: boolean }> | null;
        error: unknown;
      }>;
    };
  };
}): Promise<WeeklySchedule> {
  const { data, error } = await supabase
    .from("shop_weekly_schedule")
    .select("weekday, is_open")
    .eq("is_active", true);

  if (error) {
    if (!isMissingRelationError(error)) {
      console.error("Failed to load weekly schedule", error);
    }
    return DEFAULT_WEEKLY_SCHEDULE;
  }

  const map: Partial<Record<WeekdayKey, boolean>> = {};
  (data ?? []).forEach((row) => {
    const weekday = String(row.weekday).toLowerCase();
    if (WEEKDAY_KEYS.includes(weekday as WeekdayKey)) {
      map[weekday as WeekdayKey] = Boolean(row.is_open);
    }
  });

  return normalizeWeeklySchedule(map);
}

export async function loadTemporaryClosures(supabase: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: unknown,
      ) => {
        order: (
          column: string,
          options?: { ascending?: boolean },
        ) => Promise<{
          data: Array<{
            id: string;
            start_date: string;
            end_date: string;
            reason: string | null;
          }> | null;
          error: unknown;
        }>;
      };
    };
  };
}): Promise<TemporaryClosure[]> {
  const { data, error } = await supabase
    .from("shop_temporary_closures")
    .select("id, start_date, end_date, reason")
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  if (error) {
    if (!isMissingRelationError(error)) {
      console.error("Failed to load temporary closures", error);
    }
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    start_date: row.start_date,
    end_date: row.end_date,
    reason: row.reason,
  }));
}

export async function loadShopOperatingRules(supabase: {
  from: (table: string) => unknown;
}) {
  const [weeklySchedule, temporaryClosures] = await Promise.all([
    loadWeeklySchedule(supabase as never),
    loadTemporaryClosures(supabase as never),
  ]);

  return {
    weeklySchedule,
    temporaryClosures,
  };
}

export async function getClosedDatesMap(
  supabase: {
    from: (table: string) => unknown;
  },
  fromISO: string,
  toISO: string,
) {
  const rules = await loadShopOperatingRules(supabase);
  const dateRange = buildDateRange(fromISO, toISO);

  return dateRange.reduce<
    Record<string, { reason: string; source: "temporary" | "weekly" }>
  >((accumulator, dateISO) => {
    const status = evaluateShopDateStatus(
      dateISO,
      rules.weeklySchedule,
      rules.temporaryClosures,
    );
    if (status.closed && status.reason && status.source) {
      accumulator[dateISO] = {
        reason: status.reason,
        source: status.source,
      };
    }
    return accumulator;
  }, {});
}
