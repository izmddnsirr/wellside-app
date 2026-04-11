export const ACTIVE_BOOKING_STATUSES = ["scheduled", "in_progress"] as const;

export type ActiveBookingStatus = (typeof ACTIVE_BOOKING_STATUSES)[number];

export function isActiveBookingStatus(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(value);
}
