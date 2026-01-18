"use client";

import dynamic from "next/dynamic";
import type { BookingRow } from "./bookings-card";

const BookingsCard = dynamic(
  () => import("./bookings-card").then((mod) => mod.BookingsCard),
  { ssr: false }
);

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
