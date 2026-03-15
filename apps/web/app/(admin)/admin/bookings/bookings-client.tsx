"use client";

import type { BarberUnavailabilityRow, BookingRow } from "./bookings-card";
import { BookingsCard } from "./bookings-card";
import type {
  RestWindow,
  TemporaryClosure,
  WeeklySchedule,
} from "@/utils/shop-operations";

type BookingFormOption = {
  id: string;
  name: string;
  working_start_time?: string | null;
  working_end_time?: string | null;
  off_days?: string[] | null;
};

type ServiceFormOption = BookingFormOption & {
  durationMinutes: number | null;
};

type BookingMutationResult = {
  ok: boolean;
  error?: string;
};

type BookingsClientProps = {
  bookings: BookingRow[];
  unavailabilityEntries?: BarberUnavailabilityRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<BookingMutationResult>;
  cancelBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  deleteBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  createBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  createBarberUnavailability?: (
    formData: FormData,
  ) => Promise<BookingMutationResult>;
  deleteBarberUnavailability?: (
    formData: FormData,
  ) => Promise<BookingMutationResult>;
  customerOptions?: BookingFormOption[];
  barberOptions?: BookingFormOption[];
  serviceOptions?: ServiceFormOption[];
  shopWeeklySchedule?: WeeklySchedule;
  shopTemporaryClosures?: TemporaryClosure[];
  shopRestWindows?: RestWindow[];
  allowCancel?: boolean;
  allowDelete?: boolean;
  showActions?: boolean;
  view?: "tabs" | "active" | "past" | "calendar";
};

export function BookingsClient(props: BookingsClientProps) {
  return <BookingsCard {...props} />;
}
