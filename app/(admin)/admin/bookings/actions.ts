"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";
import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "@/utils/email/booking-cancellation";
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

  const bookingDetails =
    status === "cancelled"
      ? (
          await supabase
            .from("bookings")
            .select(
              `
              id,
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
            .single()
        ).data
      : null;

  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: status,
  });

  if (error) {
    console.error("Failed to update booking status", error);
    return;
  }

  if (status === "cancelled" && bookingDetails) {
    try {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId: id,
        });
      } else {
        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        sendOps.push(
          sendBookingCancellationEmailTo(
            payload,
            payload.customerEmail,
            "Customer"
          )
        );

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingCancellationEmailTo(payload, adminEmails, "Admin")
          );
        } else {
          console.error("Missing admin emails for booking cancellation");
        }

        await Promise.allSettled(sendOps);
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
  }

  revalidateBookings();
};

export const cancelBooking = async (formData: FormData) => {
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const { data: bookingDetails } = await supabase
    .from("bookings")
    .select(
      `
      id,
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
    .single();
  const { error } = await supabase.rpc("admin_update_booking_status", {
    p_booking_id: id,
    p_status: "cancelled",
  });

  if (error) {
    console.error("Failed to cancel booking", error);
    return;
  }

  if (bookingDetails) {
    try {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId: id,
        });
      } else {
        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        sendOps.push(
          sendBookingCancellationEmailTo(
            payload,
            payload.customerEmail,
            "Customer"
          )
        );

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingCancellationEmailTo(payload, adminEmails, "Admin")
          );
        } else {
          console.error("Missing admin emails for booking cancellation");
        }

        await Promise.allSettled(sendOps);
      }
    } catch (emailError) {
      console.error("Failed to send booking cancellation email", emailError);
    }
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
