"use client";

import type { BookingRow } from "./bookings-card";
import { BookingsCard } from "./bookings-card";

type BookingsClientProps = {
  bookings: BookingRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<void>;
  cancelBooking?: (formData: FormData) => Promise<void>;
  deleteBooking?: (formData: FormData) => Promise<void>;
  allowCancel?: boolean;
  allowDelete?: boolean;
  view?: "tabs" | "active" | "past" | "calendar";
};

export function BookingsClient(props: BookingsClientProps) {
  return <BookingsCard {...props} />;
}
