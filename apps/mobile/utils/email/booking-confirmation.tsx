import * as React from "react";
import { BookingConfirmationEmail } from "@/app/emails/booking-confirmation-email";
import { BookingConfirmationAdminEmail } from "@/app/emails/booking-confirmation-admin-email";
import { sendTransactionalEmail } from "@/utils/email/resend";
import {
  type BookingConfirmationPayload,
  buildBookingConfirmationPayload,
} from "@wellside/lib";

export { buildBookingConfirmationPayload };
export type { BookingConfirmationPayload };
export type { BookingEmailDetails } from "@wellside/lib";

export async function sendBookingConfirmationEmailTo(
  payload: BookingConfirmationPayload,
  to: string | string[],
  recipientLabel?: string,
) {
  const normalizedLabel = recipientLabel?.toLowerCase();
  const subject =
    normalizedLabel === "admin"
      ? `New booking created • ${payload.bookingId}`
      : `Your booking is confirmed • ${payload.bookingId}`;
  const preheader =
    normalizedLabel === "admin"
      ? "A new booking was just created. Review the details."
      : "You're all set. See your booking details inside.";
  return sendTransactionalEmail({
    to,
    subject,
    react: (
      (normalizedLabel === "admin" ? (
        <BookingConfirmationAdminEmail
          customerName={payload.customerName}
          customerPhone={payload.customerPhone}
          bookingId={payload.bookingId}
          services={payload.services}
          barberName={payload.barberName}
          bookingDate={payload.bookingDate}
          bookingTime={payload.bookingTime}
          totalPrice={payload.totalPrice}
          status="Confirmed"
          preheader={preheader}
        />
      ) : (
        <BookingConfirmationEmail
          customerName={payload.customerName}
          bookingId={payload.bookingId}
          services={payload.services}
          barberName={payload.barberName}
          bookingDate={payload.bookingDate}
          bookingTime={payload.bookingTime}
          totalPrice={payload.totalPrice}
          status="Confirmed"
          preheader={preheader}
        />
      )) as React.ReactElement
    ),
  });
}
