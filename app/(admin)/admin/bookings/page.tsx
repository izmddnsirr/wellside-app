import { AdminShell } from "../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { BookingsCard, type BookingRow } from "./bookings-card";

export const dynamic = "force-dynamic";

const allowedStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const updateBookingStatus = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
    return;
  }

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return;
  }

  revalidatePath("/admin/bookings");
};

const cancelBooking = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: "cancelled",
  });

  if (error) {
    console.error("Failed to cancel booking", error);
    return;
  }

  revalidatePath("/admin/bookings");
};

const deleteBooking = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete booking", error);
    return;
  }

  revalidatePath("/admin/bookings");
};

export default async function Page() {
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
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (first_name, last_name),
      service:service_id (name, duration_minutes, price)
    `
    )
    .order("start_at", { ascending: true });

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const errorMessage = error
    ? "Failed to load bookings. Please try again."
    : null;

  return (
    <AdminShell
      title="Bookings"
      description="Monitor appointments, walk-ins, and reschedules."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <BookingsCard
          bookings={bookings}
          errorMessage={errorMessage}
          allowedStatuses={[...allowedStatuses]}
          updateBookingStatus={updateBookingStatus}
          cancelBooking={cancelBooking}
          deleteBooking={deleteBooking}
        />
      </div>
    </AdminShell>
  );
}
