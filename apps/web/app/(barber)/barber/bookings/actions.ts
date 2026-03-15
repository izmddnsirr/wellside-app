import { revalidatePath } from "next/cache";
import { createBarberClient } from "@/utils/supabase/server";
import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "@/utils/email/booking-cancellation";

export const allowedStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
] as const;

type BookingMutationResult = {
  ok: boolean;
  error?: string;
};

export const updateBookingStatus = async (
  formData: FormData,
): Promise<BookingMutationResult> => {
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
    return { ok: false, error: "Invalid booking status update request." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      id,
      barber_id,
      booking_ref,
      start_at,
      end_at,
      booking_date,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (display_name, first_name, last_name),
      service:service_id (name, base_price)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking || booking.barber_id !== user.id) {
    return { ok: false, error: "Booking not found." };
  }

  const { error } = await supabase.rpc("barber_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return { ok: false, error: "Failed to update booking status." };
  }

  if (status === "cancelled") {
    try {
      const payload = buildBookingCancellationPayload(booking);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId: id,
        });
      } else {
        await sendBookingCancellationEmailTo(
          payload,
          payload.customerEmail,
          "Customer"
        );
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  revalidatePath("/barber/bookings");
  revalidatePath("/barber/bookings/active");
  revalidatePath("/barber/bookings/past");

  return { ok: true };
};
