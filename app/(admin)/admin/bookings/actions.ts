"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";
import { allowedStatuses } from "./constants";

const revalidateBookings = () => {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/active");
  revalidatePath("/admin/bookings/past");
};

export const updateBookingStatus = async (formData: FormData) => {
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

  revalidateBookings();
};

export const cancelBooking = async (formData: FormData) => {
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

  revalidateBookings();
};

export const deleteBooking = async (formData: FormData) => {
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

  revalidateBookings();
};
