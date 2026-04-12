import { createClient } from "@supabase/supabase-js";
import {
  buildBookingConfirmationPayload,
  sendBookingConfirmationEmailTo,
} from "@/utils/email/booking-confirmation";
import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "@/utils/email/booking-cancellation";

type BookingEmailEvent = "confirmation" | "cancellation";
type BookingEmailAudience = "customer" | "admin";

type BookingEmailRequest = {
  event: BookingEmailEvent;
  audience: BookingEmailAudience;
  bookingId?: string | null;
  bookingRef?: string | null;
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const asTrimmed = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isAudience = (value: unknown): value is BookingEmailAudience =>
  value === "customer" || value === "admin";

const isEvent = (value: unknown): value is BookingEmailEvent =>
  value === "confirmation" || value === "cancellation";

const requireField = (value: string | null, label: string) => {
  if (!value?.trim()) {
    return `${label} is required.`;
  }
  return null;
};

const getSupabaseServiceClient = () => {
  const url =
    asTrimmed(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    asTrimmed(process.env.SUPABASE_URL);
  const serviceRoleKey =
    asTrimmed(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    asTrimmed(process.env.SUPABASE_SERVICE_KEY);

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const getSupabaseAuthClient = () => {
  const url =
    asTrimmed(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    asTrimmed(process.env.SUPABASE_URL);
  const anonKey = asTrimmed(process.env.EXPO_PUBLIC_SUPABASE_KEY);
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const hasRecipients = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value.some((entry) => asTrimmed(entry));
  }
  return !!asTrimmed(value);
};

const sanitizeRecipients = (value: string | string[]) =>
  Array.isArray(value)
    ? value.map((entry) => asTrimmed(entry)).filter(Boolean)
    : asTrimmed(value);

const fetchAdminEmails = async () => {
  const client = getSupabaseServiceClient();
  if (!client) {
    return [] as string[];
  }

  const { data, error } = await client
    .from("profiles")
    .select("email")
    .eq("role", "admin");

  if (error || !data) {
    console.warn("Admin email fetch failed:", error);
    return [] as string[];
  }

  return data
    .map((row) => asTrimmed(row.email))
    .filter((email) => email);
};

const parseBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return asTrimmed(authHeader.slice(7));
};

type BookingRow = {
  id: string;
  booking_ref: string | null;
  start_at: string | null;
  end_at: string | null;
  booking_date: string | null;
  customer_id: string;
  barber_id: string;
  service_id: string;
};

const getBookingEmailDetails = async (
  serviceClient: NonNullable<ReturnType<typeof getSupabaseServiceClient>>,
  bookingId: string,
  bookingRef?: string
) => {
  const bookingByIdQuery = serviceClient
    .from("bookings")
    .select("id,booking_ref,start_at,end_at,booking_date,customer_id,barber_id,service_id")
    .eq("id", bookingId);

  const { data: bookingById, error: bookingByIdError } =
    await bookingByIdQuery.maybeSingle<BookingRow>();

  let bookingRow = bookingById;
  let bookingError = bookingByIdError;

  if (!bookingRow && bookingRef) {
    const { data: bookingByRef, error: bookingByRefError } = await serviceClient
      .from("bookings")
      .select("id,booking_ref,start_at,end_at,booking_date,customer_id,barber_id,service_id")
      .eq("booking_ref", bookingRef)
      .maybeSingle<BookingRow>();
    bookingRow = bookingByRef;
    bookingError = bookingByRefError;
  }

  if (bookingError || !bookingRow) {
    return null;
  }

  const [{ data: customer }, { data: barber }, { data: service }] =
    await Promise.all([
      serviceClient
        .from("profiles")
        .select("first_name,last_name,email,phone")
        .eq("id", bookingRow.customer_id)
        .maybeSingle(),
      serviceClient
        .from("profiles")
        .select("display_name,first_name,last_name,email")
        .eq("id", bookingRow.barber_id)
        .maybeSingle(),
      serviceClient
        .from("services")
        .select("name,base_price")
        .eq("id", bookingRow.service_id)
        .maybeSingle(),
    ]);

  if (!customer || !barber || !service) {
    return null;
  }

  return {
    booking: bookingRow,
    details: {
      id: bookingRow.id,
      booking_ref: bookingRow.booking_ref,
      start_at: bookingRow.start_at,
      end_at: bookingRow.end_at,
      booking_date: bookingRow.booking_date,
      customer: {
        first_name: customer.first_name ?? null,
        last_name: customer.last_name ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
      },
      barber: {
        display_name: barber.display_name ?? null,
        first_name: barber.first_name ?? null,
        last_name: barber.last_name ?? null,
        email: barber.email ?? null,
      },
      service: {
        name: service.name ?? null,
        base_price: service.base_price ?? null,
      },
    },
  };
};

export async function POST(request: Request) {
  let body: BookingEmailRequest;
  try {
    body = (await request.json()) as BookingEmailRequest;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  if (!isEvent(body.event)) {
    return json(400, { error: "Invalid event type." });
  }
  if (!isAudience(body.audience)) {
    return json(400, { error: "Invalid audience type." });
  }

  const bookingId = asTrimmed(body.bookingId);
  const bookingRef = asTrimmed(body.bookingRef);
  const missing = requireField(bookingId, "Booking reference");

  if (missing) {
    return json(400, { error: missing });
  }

  const token = parseBearerToken(request);
  if (!token) {
    return json(401, { error: "Missing authorization token." });
  }

  const authClient = getSupabaseAuthClient();
  if (!authClient) {
    return json(500, { error: "Supabase auth client is not configured." });
  }

  const { data: userData, error: userError } = await authClient.auth.getUser(
    token
  );
  if (userError || !userData.user) {
    return json(401, { error: "Invalid or expired authorization token." });
  }

  const serviceClient = getSupabaseServiceClient();
  if (!serviceClient) {
    return json(500, { error: "Supabase service client is not configured." });
  }

  const bookingBundle = await getBookingEmailDetails(
    serviceClient,
    bookingId,
    bookingRef || undefined
  );
  if (!bookingBundle) {
    return json(404, { error: "Booking not found." });
  }

  if (bookingBundle.booking.customer_id !== userData.user.id) {
    return json(403, { error: "You are not allowed to send this booking email." });
  }

  const adminEmails =
    body.audience === "admin" ? await fetchAdminEmails() : [];
  const adminEmailFallback =
    asTrimmed(process.env.BOOKING_ADMIN_EMAIL) ||
    asTrimmed(process.env.RESEND_ADMIN_EMAIL);

  try {
    if (body.event === "confirmation") {
      const built = buildBookingConfirmationPayload(bookingBundle.details);
      const recipient =
        body.audience === "admin"
          ? adminEmails.length > 0
            ? adminEmails
            : adminEmailFallback
          : built.customerEmail ?? "";
      const to = sanitizeRecipients(recipient);
      if (
        !hasRecipients(to) ||
        requireField(built.payload.bookingId, "Booking reference")
      ) {
        return json(400, { error: "Recipient email is required." });
      }

      await sendBookingConfirmationEmailTo(
        built.payload,
        to,
        body.audience
      );
    } else {
      const payload = buildBookingCancellationPayload(bookingBundle.details);
      if (!payload) {
        return json(400, { error: "Customer email is required." });
      }

      const recipient =
        body.audience === "admin"
          ? adminEmails.length > 0
            ? adminEmails
            : adminEmailFallback
          : payload.customerEmail;
      const to = sanitizeRecipients(recipient);
      if (!hasRecipients(to)) {
        return json(400, { error: "Recipient email is required." });
      }

      await sendBookingCancellationEmailTo(
        payload,
        to,
        body.audience
      );
    }
  } catch (error) {
    console.error("Booking email send failed:", error);
    return json(500, { error: "Unable to send booking email." });
  }

  return json(200, { ok: true });
}
