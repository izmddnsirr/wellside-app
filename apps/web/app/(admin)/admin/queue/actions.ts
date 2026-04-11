"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";
import { createAdminAuthClient } from "@/utils/supabase/admin";


const malaysiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export async function checkInBooking(bookingId: string) {
  const supabase = createAdminAuthClient();
  const today = malaysiaDateFormatter.format(new Date());

  const { data: bookingMax } = await supabase
    .from("bookings")
    .select("queue_number")
    .eq("booking_date", today)
    .not("queue_number", "is", null)
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = ((bookingMax?.queue_number as number | null) ?? 0) + 1;

  const { error } = await supabase
    .from("bookings")
    .update({ queue_number: nextNumber, checked_in_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) console.error("checkInBooking failed", error);
  revalidatePath("/admin/queue");
}

export async function undoCheckIn(bookingId: string) {
  const supabase = createAdminAuthClient();
  const { error } = await supabase
    .from("bookings")
    .update({ queue_number: null, checked_in_at: null })
    .eq("id", bookingId);
  if (error) console.error("undoCheckIn failed", error);
  revalidatePath("/admin/queue");
}

export async function undoServeBooking(bookingId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_status: "scheduled",
  });
  if (error) console.error("undoServeBooking failed", error);
  revalidatePath("/admin/queue");
}

export async function serveBooking(bookingId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_status: "in_progress",
  });
  if (error) console.error("serveBooking failed", error);
  revalidatePath("/admin/queue");
}

export async function completeBooking(bookingId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_status: "completed",
  });
  if (error) console.error("completeBooking failed", error);
  revalidatePath("/admin/queue");
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: bookingId,
    p_status: "cancelled",
  });
  if (error) console.error("cancelBooking failed", error);
  revalidatePath("/admin/queue");
}
