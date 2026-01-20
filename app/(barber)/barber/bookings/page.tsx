import { BarberShell } from "../components/barber-shell";
import { createBarberClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type BookingRow,
} from "../../../(admin)/admin/bookings/bookings-card";
import { BookingsClient } from "../../../(admin)/admin/bookings/bookings-client";

export const dynamic = "force-dynamic";

const allowedStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
] as const;

const updateBookingStatus = async (formData: FormData) => {
  "use server";
  const supabase = await createBarberClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (
    !user?.id ||
    !id ||
    !allowedStatuses.includes(status as (typeof allowedStatuses)[number])
  ) {
    return;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, barber_id")
    .eq("id", id)
    .maybeSingle();

  if (!booking || booking.barber_id !== user.id) {
    return;
  }

  const { error } = await supabase.rpc("barber_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return;
  }

  revalidatePath("/barber/bookings");
};

export default async function Page() {
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

  return (
    <BarberShell
      title="Bookings"
      description="Monitor appointments, walk-ins, and reschedules."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <BookingsClient
          bookings={bookings}
          errorMessage={errorMessage}
          allowedStatuses={[...allowedStatuses]}
          updateBookingStatus={updateBookingStatus}
          allowCancel={false}
          allowDelete={false}
        />
      </div>
    </BarberShell>
  );
}
