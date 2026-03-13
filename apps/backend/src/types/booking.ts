export type Slot = {
  label: string;
  start_at: string;
  end_at: string;
};

export type BookingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

export type WeeklySchedule = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  boolean
>;

export type TemporaryClosure = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
};
