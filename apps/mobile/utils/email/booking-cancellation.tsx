import * as React from "react";
import { BookingCancellationEmail } from "@/app/emails/booking-cancellation-email";
import { BookingCancellationAdminEmail } from "@/app/emails/booking-cancellation-admin-email";
import { sendTransactionalEmail } from "@/utils/email/resend";
import {
  type BookingCancellationPayload,
  buildBookingCancellationPayload,
} from "@wellside/lib";

export { buildBookingCancellationPayload };
export type { BookingCancellationPayload };
export type { BookingEmailDetails } from "@wellside/lib";

export async function sendBookingCancellationEmail(
  payload: BookingCancellationPayload,
) {
  return sendBookingCancellationEmailTo(payload, payload.customerEmail, "Customer");
}

export async function sendBookingCancellationEmailTo(
  payload: BookingCancellationPayload,
  to: string | string[],
  recipientLabel?: string,
) {
  const normalizedLabel = recipientLabel?.toLowerCase();
  const subject = `Booking cancelled • ${payload.bookingId}`;
  const preheader =
    normalizedLabel === "admin"
      ? "A booking was cancelled. Review the details."
      : "Your booking has been cancelled.";

  return sendTransactionalEmail({
    to,
    subject,
    react: (
      (normalizedLabel === "admin" ? (
        <BookingCancellationAdminEmail
          customerName={payload.customerName}
          customerPhone={payload.customerPhone}
          bookingId={payload.bookingId}
          services={payload.services}
          barberName={payload.barberName}
          bookingDate={payload.bookingDate}
          bookingTime={payload.bookingTime}
          totalPrice={payload.totalPrice}
          status="Cancelled"
          preheader={preheader}
        />
      ) : (
        <BookingCancellationEmail
          customerName={payload.customerName}
          bookingId={payload.bookingId}
          services={payload.services}
          barberName={payload.barberName}
          bookingDate={payload.bookingDate}
          bookingTime={payload.bookingTime}
          totalPrice={payload.totalPrice}
          status="Cancelled"
        />
      )) as React.ReactElement
    ),
  });
}
