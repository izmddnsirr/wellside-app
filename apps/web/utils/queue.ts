import { createAdminClient } from "@/utils/supabase/server";

type QueueBookingRow = {
  id: string;
  booking_ref: string | null;
  status: string | null;
  start_at: string | null;
  booking_date: string | null;
  created_at: string | null;
  walk_in_name: string | null;
  customer: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  walk_in_customer: {
    name?: string | null;
    phone?: string | null;
  } | null;
  barber: {
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
  } | null;
  service: {
    name?: string | null;
  } | null;
};

export type QueueListItem = {
  id: string;
  name: string;
  ref: string;
  timeLabel: string;
  serviceLabel: string;
  barberLabel: string;
  type: "Booking";
  phone: string | null;
  queueNumber: number | null;
  startedAt: string | null;
};

export type QueueDashboardData = {
  pin: string;
  displayUrl: string;
  upcomingBookings: QueueListItem[];
  checkedInBookings: QueueListItem[];
  currentlyServing: QueueListItem[];
};

const malaysiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const malaysiaTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const getMalaysiaDateString = (date: Date) => malaysiaDateFormatter.format(date);

const getBookingName = (booking: QueueBookingRow) => {
  const customerName = [
    booking.customer?.first_name,
    booking.customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    booking.walk_in_name?.trim() ||
    booking.walk_in_customer?.name?.trim() ||
    customerName ||
    booking.customer?.email?.trim() ||
    "Guest"
  );
};

const getBarberName = (booking: QueueBookingRow) =>
  booking.barber?.display_name?.trim() ||
  [booking.barber?.first_name, booking.barber?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() ||
  "Unassigned";

const formatQueueTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return malaysiaTimeFormatter.format(parsed).toUpperCase();
};

export const createDailyQueuePin = (date = new Date()) => {
  const source = `${getMalaysiaDateString(date)}:wellside-tv`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 1000000;
  }

  return String(hash).padStart(6, "0");
};

const toQueueItem = (booking: QueueBookingRow & { queue_number?: number | null }): QueueListItem => ({
  id: booking.id,
  name: getBookingName(booking),
  ref: booking.booking_ref?.trim() || booking.id.slice(0, 8).toUpperCase(),
  timeLabel: formatQueueTime(booking.start_at),
  serviceLabel: booking.service?.name?.trim() || "Service",
  barberLabel: getBarberName(booking),
  type: "Booking",
  phone: booking.walk_in_customer?.phone?.trim() ?? booking.customer?.phone?.trim() ?? null,
  queueNumber: booking.queue_number ?? null,
  startedAt: booking.start_at ?? null,
});

export const getQueueDashboardData = async (): Promise<QueueDashboardData> => {
  const supabase = await createAdminClient();
  const todayDate = getMalaysiaDateString(new Date());
  const pin = createDailyQueuePin();
  const displayUrl = `/tv/display`;

  const bookingSelect = `
      id,
      booking_ref,
      status,
      start_at,
      booking_date,
      created_at,
      queue_number,
      walk_in_name,
      customer:customer_id (first_name, last_name, email, phone),
      walk_in_customer:walk_in_customer_id (name, phone),
      barber:barber_id (first_name, last_name, display_name),
      service:service_id (name)
    `;

  const { data: scheduledData } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("booking_date", todayDate)
    .eq("status", "scheduled")
    .order("start_at", { ascending: true });

  const scheduledBookings = (scheduledData ?? []) as unknown as (QueueBookingRow & { queue_number: number | null })[];
  const upcomingBookings = scheduledBookings.filter((b) => b.queue_number === null).map(toQueueItem);
  const checkedInBookings = scheduledBookings.filter((b) => b.queue_number !== null).map(toQueueItem);

  const { data: servingData } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("booking_date", todayDate)
    .eq("status", "in_progress")
    .order("start_at", { ascending: true });

  const currentlyServing = ((servingData ?? []) as unknown as QueueBookingRow[]).map(
    toQueueItem,
  );

  return {
    pin,
    displayUrl,
    upcomingBookings,
    checkedInBookings,
    currentlyServing,
  };
};
