"use client";

import type { BookingRow } from "./bookings-card";
import { BookingsCard } from "./bookings-card";

type BookingFormOption = {
  id: string;
  name: string;
  working_start_time?: string | null;
  working_end_time?: string | null;
};

type ServiceFormOption = BookingFormOption & {
  durationMinutes: number | null;
};

type BookingsClientProps = {
  bookings: BookingRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<void>;
  cancelBooking?: (formData: FormData) => Promise<void>;
  deleteBooking?: (formData: FormData) => Promise<void>;
  createBooking?: (formData: FormData) => Promise<void>;
  customerOptions?: BookingFormOption[];
  barberOptions?: BookingFormOption[];
  serviceOptions?: ServiceFormOption[];
  allowCancel?: boolean;
  allowDelete?: boolean;
  showActions?: boolean;
  view?: "tabs" | "active" | "past" | "calendar";
};

export function BookingsClient(props: BookingsClientProps) {
  return <BookingsCard {...props} />;
}
