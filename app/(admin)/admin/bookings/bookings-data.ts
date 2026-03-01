import { createAdminClient } from "@/utils/supabase/server";
import type { BookingRow } from "./bookings-card";

type BookingFormOption = {
  id: string;
  name: string;
  working_start_time?: string | null;
  working_end_time?: string | null;
};

type ServiceFormOption = BookingFormOption & {
  durationMinutes: number | null;
};

const toProfileName = (profile: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) =>
  profile.display_name?.trim() ||
  [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
  profile.email?.trim() ||
  "Unknown";

export const getBookings = async () => {
  const supabase = await createAdminClient();
  const { data: bookingsData, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_ref,
      status,
      start_at,
      end_at,
      booking_date,
      created_at,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (first_name, last_name),
      service:service_id (name, duration_minutes, base_price)
    `,
    )
    .order("start_at", { ascending: true });

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const errorMessage = error
    ? "Failed to load bookings. Please try again."
    : null;

  return { bookings, errorMessage };
};

export const getBookingFormOptions = async () => {
  const supabase = await createAdminClient();

  const [
    { data: customersData },
    { data: barbersData },
    { data: servicesData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, email")
      .eq("role", "customer")
      .order("first_name", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, display_name, working_start_time, working_end_time",
      )
      .eq("role", "barber")
      .eq("is_active", true)
      .order("display_name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const customerOptions: BookingFormOption[] = (customersData ?? []).map(
    (customer) => ({
      id: customer.id,
      name: toProfileName(customer),
    }),
  );

  const barberOptions: BookingFormOption[] = (barbersData ?? []).map(
    (barber) => ({
      id: barber.id,
      name: toProfileName(barber),
      working_start_time: barber.working_start_time,
      working_end_time: barber.working_end_time,
    }),
  );

  const serviceOptions: ServiceFormOption[] = (servicesData ?? []).map(
    (service) => ({
      id: service.id,
      name: service.name || "Service",
      durationMinutes: service.duration_minutes,
    }),
  );

  return {
    customerOptions,
    barberOptions,
    serviceOptions,
  };
};
