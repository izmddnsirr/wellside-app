"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const barberId = String(formData.get("barberId") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!bookingId || !barberId || !rating || rating < 1 || rating > 5) {
    return { ok: false, error: "Invalid review data." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase.from("barber_reviews").insert({
    booking_id: bookingId,
    customer_id: user.id,
    barber_id: barberId,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "You have already reviewed this booking." };
    return { ok: false, error: "Failed to submit review." };
  }

  revalidatePath("/profile");
  return { ok: true };
}
