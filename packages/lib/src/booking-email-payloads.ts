export type BookingEmailDetails = {
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

export type BookingConfirmationPayload = {
  customerName: string;
  customerPhone?: string | null;
  bookingId: string;
  services: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: string;
};

export type BookingCancellationPayload = {
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

const resolveSingle = <T,>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

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

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

function buildCommonBookingFields(bookingDetails: BookingEmailDetails) {
  const customer = resolveSingle(bookingDetails.customer);
  const barber = resolveSingle(bookingDetails.barber);
  const service = resolveSingle(bookingDetails.service);

  const customerName =
    [customer?.first_name, customer?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Customer";
  const barberName =
    barber?.display_name?.trim() ||
    [barber?.first_name, barber?.last_name].filter(Boolean).join(" ").trim() ||
    "Barber";
  const services = service?.name ?? "Service";
  const bookingId = bookingDetails.booking_ref || bookingDetails.id;
  const startAt = bookingDetails.start_at ?? "";
  const endAt = bookingDetails.end_at ?? "";

  const startDate = startAt ? new Date(startAt) : null;
  const endDate = endAt ? new Date(endAt) : null;
  const bookingDate = startDate
    ? dateFormatter.format(startDate)
    : (bookingDetails.booking_date ?? "-");
  const bookingTime = startDate
    ? endDate
      ? `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`
      : timeFormatter.format(startDate)
    : "-";
  const totalPrice = currencyFormatter.format(service?.base_price ?? 0);

  return {
    customer,
    barber,
    customerName,
    barberName,
    services,
    bookingId,
    bookingDate,
    bookingTime,
    totalPrice,
  };
}

export function buildBookingConfirmationPayload(
  bookingDetails: BookingEmailDetails,
) {
  const common = buildCommonBookingFields(bookingDetails);

  return {
    payload: {
      customerName: common.customerName,
      customerPhone: common.customer?.phone ?? null,
      bookingId: common.bookingId,
      services: common.services,
      barberName: common.barberName,
      bookingDate: common.bookingDate,
      bookingTime: common.bookingTime,
      totalPrice: common.totalPrice,
    } satisfies BookingConfirmationPayload,
    customerEmail: common.customer?.email ?? null,
    barberEmail: common.barber?.email ?? null,
  };
}

export function buildBookingCancellationPayload(
  bookingDetails: BookingEmailDetails,
): BookingCancellationPayload | null {
  const common = buildCommonBookingFields(bookingDetails);
  const customerEmail = common.customer?.email ?? "";
  if (!customerEmail) {
    return null;
  }

  return {
    customerEmail,
    customerName: common.customerName,
    customerPhone: common.customer?.phone ?? null,
    bookingId: common.bookingId,
    services: common.services,
    barberName: common.barberName,
    bookingDate: common.bookingDate,
    bookingTime: common.bookingTime,
    totalPrice: common.totalPrice,
  };
}
