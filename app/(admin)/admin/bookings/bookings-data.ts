import { createAdminClient } from "@/utils/supabase/server";
import type { BookingRow } from "./bookings-card";

export const getBookings = async () => {
  const supabase = await createAdminClient();
  const { data: bookingsData, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      start_at,
      end_at,
      booking_date,
      created_at,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (first_name, last_name),
      service:service_id (name, duration_minutes, base_price)
    `
    )
    .order("start_at", { ascending: true });

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const errorMessage = error
    ? "Failed to load bookings. Please try again."
    : null;

  return { bookings, errorMessage };
};
