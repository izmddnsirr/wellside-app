import * as React from "react";
import { BookingConfirmationEmail } from "@/components/emails/booking-confirmation-email";
import { BookingConfirmationAdminEmail } from "@/components/emails/booking-confirmation-admin-email";
import { sendTransactionalEmail } from "@/utils/email/resend";

type BookingConfirmationPayload = {
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
    | {
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email?: string | null;
      }
    | {
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email?: string | null;
      }[]
    | null;
  service:
    | { name: string | null; base_price: number | null }
    | { name: string | null; base_price: number | null }[]
    | null;
};

const resolveSingle = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export const buildBookingConfirmationPayload = (
  bookingDetails: BookingEmailDetails
) => {
  const customer = resolveSingle(bookingDetails.customer);
  const barber = resolveSingle(bookingDetails.barber);
  const service = resolveSingle(bookingDetails.service);

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
    payload: {
      customerName,
      customerPhone: customer?.phone ?? null,
      bookingId: bookingLabel,
      services,
      barberName,
      bookingDate: bookingDateLabel,
      bookingTime: bookingTimeLabel,
      totalPrice,
    } satisfies BookingConfirmationPayload,
    customerEmail: customer?.email ?? null,
    barberEmail: barber?.email ?? null,
  };
};

export async function sendBookingConfirmationEmailTo(
  payload: BookingConfirmationPayload,
  to: string | string[],
  recipientLabel?: string
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
