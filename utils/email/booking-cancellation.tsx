import * as React from "react";
import { BookingCancellationEmail } from "@/components/emails/booking-cancellation-email";
import { BookingCancellationAdminEmail } from "@/components/emails/booking-cancellation-admin-email";
import { sendTransactionalEmail } from "@/utils/email/resend";

type BookingCancellationPayload = {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  bookingId: string;
  services: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: string;
};

type BookingEmailDetails = {
  id: string;
  booking_ref: string | null;
  start_at: string | null;
  end_at: string | null;
  booking_date: string | null;
  customer:
    | {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone?: string | null;
      }
    | {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone?: string | null;
      }[]
    | null;
  barber:
    | { display_name: string | null; first_name: string | null; last_name: string | null }
    | { display_name: string | null; first_name: string | null; last_name: string | null }[]
    | null;
  service:
    | { name: string | null; base_price: number | null }
    | { name: string | null; base_price: number | null }[]
    | null;
};

const resolveSingle = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export const buildBookingCancellationPayload = (
  bookingDetails: BookingEmailDetails
): BookingCancellationPayload | null => {
  const customer = resolveSingle(bookingDetails.customer);
  const barber = resolveSingle(bookingDetails.barber);
  const service = resolveSingle(bookingDetails.service);

  const customerEmail = customer?.email ?? "";
  if (!customerEmail) {
    return null;
  }

  const customerName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ").trim() ||
    "Customer";
  const barberName =
    barber?.display_name?.trim() ||
    [barber?.first_name, barber?.last_name].filter(Boolean).join(" ").trim() ||
    "Barber";
  const services = service?.name ?? "Service";
  const bookingLabel = bookingDetails.booking_ref || bookingDetails.id;
  const startAt = bookingDetails.start_at ?? "";
  const endAt = bookingDetails.end_at ?? "";

  const dateFormatter = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  });

  const startDate = startAt ? new Date(startAt) : null;
  const endDate = endAt ? new Date(endAt) : null;
  const bookingDateLabel = startDate
    ? dateFormatter.format(startDate)
    : bookingDetails.booking_date ?? "-";
  const bookingTimeLabel = startDate
    ? endDate
      ? `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`
      : timeFormatter.format(startDate)
    : "-";
  const totalPrice = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(service?.base_price ?? 0);

  return {
    customerEmail,
    customerName,
    customerPhone: customer?.phone ?? null,
    bookingId: bookingLabel,
    services,
    barberName,
    bookingDate: bookingDateLabel,
    bookingTime: bookingTimeLabel,
    totalPrice,
  };
};

export async function sendBookingCancellationEmail(
  payload: BookingCancellationPayload
) {
  return sendBookingCancellationEmailTo(payload, payload.customerEmail, "Customer");
}

export async function sendBookingCancellationEmailTo(
  payload: BookingCancellationPayload,
  to: string | string[],
  recipientLabel?: string
) {
  const normalizedLabel = recipientLabel?.toLowerCase();
  const subject =
    normalizedLabel === "admin"
      ? `Booking cancelled • ${payload.bookingId}`
      : `Booking cancelled • ${payload.bookingId}`;
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
