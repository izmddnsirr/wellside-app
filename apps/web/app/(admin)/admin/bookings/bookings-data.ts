import { createAdminClient } from "@/utils/supabase/server";
import type { BarberUnavailabilityRow, BookingRow } from "./bookings-card";

type BookingFormOption = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  working_start_time?: string | null;
  working_end_time?: string | null;
  off_days?: string[] | null;
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
  const [{ data: bookingsData, error }, { data: unavailabilityData }] =
    await Promise.all([
      supabase
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
          walk_in_customer:walk_in_customer_id (name, phone),
          barber:barber_id (first_name, last_name),
          service:service_id (name, duration_minutes, base_price)
        `,
        )
        .order("start_at", { ascending: true }),
      supabase
        .from("barber_unavailability")
        .select("id, barber_id, start_at, end_at, reason")
        .order("start_at", { ascending: true }),
    ]);

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const unavailabilityEntries = (unavailabilityData ??
    []) as unknown as BarberUnavailabilityRow[];
  const errorMessage = error
    ? "Failed to load bookings. Please try again."
    : null;

  return { bookings, unavailabilityEntries, errorMessage };
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
      .select("id, first_name, last_name, display_name, email, phone")
      .eq("role", "customer")
      .order("first_name", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, display_name, working_start_time, working_end_time, off_days",
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
      email: customer.email ?? null,
      phone: customer.phone ?? null,
    }),
  );

  const barberOptions: BookingFormOption[] = (barbersData ?? []).map(
    (barber) => ({
      id: barber.id,
      name: toProfileName(barber),
      working_start_time: barber.working_start_time,
      working_end_time: barber.working_end_time,
      off_days: barber.off_days ?? null,
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
