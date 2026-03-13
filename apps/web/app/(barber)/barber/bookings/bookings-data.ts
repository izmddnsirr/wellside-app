import { createBarberClient } from "@/utils/supabase/server";
import { type BookingRow } from "../../../(admin)/admin/bookings/bookings-card";

export const getBarberBookings = async () => {
  const supabase = await createBarberClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookingsData, error } = user?.id
    ? await supabase
        .from("bookings")
        .select(
          `
        id,
        booking_ref,
        status,
        start_at,
        end_at,
        booking_date,
        customer:customer_id (first_name, last_name, email, phone),
        barber:barber_id (first_name, last_name),
        service:service_id (name, duration_minutes, base_price)
      `
        )
        .eq("barber_id", user.id)
        .order("start_at", { ascending: true })
    : { data: [], error: null };

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const errorMessage = error
    ? "Failed to load bookings. Please try again."
    : null;

  return { bookings, errorMessage };
};
