import { revalidatePath } from "next/cache";
import { createBarberClient } from "@/utils/supabase/server";

export const allowedStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
] as const;

export const updateBookingStatus = async (formData: FormData) => {
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
  revalidatePath("/barber/bookings/active");
  revalidatePath("/barber/bookings/past");
};
