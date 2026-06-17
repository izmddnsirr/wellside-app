import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "Wellside <no-reply@mail.wellside.xyz>";
const TIME_ZONE = "Asia/Kuala_Lumpur";

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

type Event = "confirmation" | "cancellation";

type RequestBody = {
  event: Event;
  bookingId: string;
};

type BookingPayload = {
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  bookingId: string;
  services: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: string;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildDetailsTable(
  payload: BookingPayload,
  status: string,
  opts?: { includeCustomer?: boolean },
): string {
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;color:#6b7280">${escapeHtml(label)}</td><td style="padding:6px 0;${bold ? "font-weight:600;" : ""}">${escapeHtml(value)}</td></tr>`;

  let rows = row("Booking ID", payload.bookingId, true);
  if (opts?.includeCustomer) {
    rows += row("Customer", payload.customerName);
    if (payload.customerPhone) {
      rows += row("Phone", payload.customerPhone);
    }
  }
  rows += row("Service", payload.services);
  rows += row("Barber", payload.barberName);
  rows += row("Date", payload.bookingDate);
  rows += row("Time", payload.bookingTime);
  rows += row("Total", payload.totalPrice);
  rows += row("Status", status);

  return `<table style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>`;
}

function buildHtml(
  title: string,
  intro: string,
  table: string,
  footer: string,
  preheader?: string,
): string {
  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${escapeHtml(preheader)}</div>`
    : "";
  return `<div style="font-family:ui-sans-serif,system-ui;line-height:1.6">${preheaderBlock}<h1>${escapeHtml(title)}</h1>${intro}${table}<p>${escapeHtml(footer)}</p></div>`;
}

function buildConfirmationCustomerHtml(payload: BookingPayload): string {
  const table = buildDetailsTable(payload, "Confirmed");
  return buildHtml(
    "Booking confirmed",
    `<p>Hi ${escapeHtml(payload.customerName)},</p><p>Your booking has been confirmed. Here are the details:</p>`,
    table,
    "If you have any questions, just reply to this email.",
    "You're all set. See your booking details inside.",
  );
}

function buildConfirmationAdminHtml(payload: BookingPayload): string {
  const table = buildDetailsTable(payload, "Confirmed", {
    includeCustomer: true,
  });
  return buildHtml(
    "New booking created",
    "<p>A new booking has been created. Review the details below and assign if needed.</p>",
    table,
    "Open the admin dashboard to manage this booking.",
    "A new booking was just created. Review the details.",
  );
}

function buildCancellationCustomerHtml(payload: BookingPayload): string {
  const table = buildDetailsTable(payload, "Cancelled");
  return buildHtml(
    "Booking cancelled",
    `<p>Hi ${escapeHtml(payload.customerName)},</p><p>Your booking has been cancelled. Here are the details:</p>`,
    table,
    "If you need a new slot, you can book again anytime.",
  );
}

function buildCancellationAdminHtml(payload: BookingPayload): string {
  const table = buildDetailsTable(payload, "Cancelled", {
    includeCustomer: true,
  });
  return buildHtml(
    "Booking cancelled",
    "<p>A booking has been cancelled. Review the details below.</p>",
    table,
    "Open the admin dashboard for follow-up actions.",
    "A booking was cancelled. Review the details.",
  );
}

async function sendEmail(
  resendApiKey: string,
  to: string | string[],
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const { event, bookingId } = body;
  if (event !== "confirmation" && event !== "cancellation") {
    return json(400, { error: "Invalid event. Must be 'confirmation' or 'cancellation'." });
  }
  if (!bookingId || typeof bookingId !== "string") {
    return json(400, { error: "bookingId is required." });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    return json(401, { error: "Missing authorization token." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase credentials not configured." });
  }
  if (!resendApiKey) {
    return json(500, { error: "RESEND_API_KEY not configured." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Verify JWT
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return json(401, { error: "Invalid or expired token." });
  }

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, booking_ref, start_at, end_at, booking_date, customer_id, barber_id, service_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return json(404, { error: "Booking not found." });
  }

  if (booking.customer_id !== userData.user.id) {
    return json(403, { error: "You are not allowed to send this booking email." });
  }

  // Fetch related data in parallel
  const [customerResult, barberResult, serviceResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, email, phone")
      .eq("id", booking.customer_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("display_name, first_name, last_name")
      .eq("id", booking.barber_id)
      .maybeSingle(),
    supabase
      .from("services")
      .select("name, base_price")
      .eq("id", booking.service_id)
      .maybeSingle(),
  ]);

  const customer = customerResult.data;
  const barber = barberResult.data;
  const service = serviceResult.data;

  if (!customer || !barber || !service) {
    return json(404, { error: "Booking details incomplete." });
  }

  const customerEmail = customer.email?.trim();
  if (!customerEmail) {
    return json(400, { error: "Customer email is missing." });
  }

  // Build payload
  const customerName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || "Customer";
  const barberName =
    barber.display_name?.trim() ||
    [barber.first_name, barber.last_name].filter(Boolean).join(" ").trim() ||
    "Barber";

  const startDate = booking.start_at ? new Date(booking.start_at) : null;
  const endDate = booking.end_at ? new Date(booking.end_at) : null;
  const bookingDate = startDate
    ? dateFormatter.format(startDate)
    : booking.booking_date ?? "-";
  const bookingTime = startDate
    ? endDate
      ? `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`
      : timeFormatter.format(startDate)
    : "-";

  const payload: BookingPayload = {
    customerName,
    customerPhone: customer.phone ?? null,
    customerEmail,
    bookingId: booking.booking_ref || booking.id,
    services: service.name ?? "Service",
    barberName,
    bookingDate,
    bookingTime,
    totalPrice: currencyFormatter.format(service.base_price ?? 0),
  };

  // Fetch admin emails
  const { data: adminRows } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "admin")
    .not("email", "is", null);

  const adminEmails = (adminRows ?? [])
    .map((row: { email: string | null }) => row.email?.trim())
    .filter((email?: string): email is string => !!email);

  // Build HTML and subjects
  const isConfirmation = event === "confirmation";
  const customerHtml = isConfirmation
    ? buildConfirmationCustomerHtml(payload)
    : buildCancellationCustomerHtml(payload);
  const adminHtml = isConfirmation
    ? buildConfirmationAdminHtml(payload)
    : buildCancellationAdminHtml(payload);
  const customerSubject = isConfirmation
    ? `Your booking is confirmed • ${payload.bookingId}`
    : `Booking cancelled • ${payload.bookingId}`;
  const adminSubject = isConfirmation
    ? `New booking created • ${payload.bookingId}`
    : `Booking cancelled • ${payload.bookingId}`;

  // Send emails in parallel
  const sendOps: Promise<boolean>[] = [
    sendEmail(resendApiKey, customerEmail, customerSubject, customerHtml),
  ];
  if (adminEmails.length > 0) {
    sendOps.push(sendEmail(resendApiKey, adminEmails, adminSubject, adminHtml));
  }

  const results = await Promise.allSettled(sendOps);
  const customerSent = results[0].status === "fulfilled" && results[0].value;
  const adminSent =
    results.length > 1
      ? results[1].status === "fulfilled" && results[1].value
      : false;

  return json(200, { ok: true, customerSent, adminSent });
});
