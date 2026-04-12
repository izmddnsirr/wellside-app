import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;
const TIME_ZONE = "Asia/Kuala_Lumpur";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "short",
  day: "numeric",
});

type ReminderType = "24h" | "1h";

type Booking = {
  id: string;
  customer_id: string;
  start_at: string;
  service: { name: string } | null;
  barber: { display_name: string | null; first_name: string | null } | null;
};

Deno.serve(async (req) => {
  // Only allow POST requests (from pg_cron or Supabase scheduler)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase credentials", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const now = new Date();

  const windows: Array<{ type: ReminderType; fromMins: number; toMins: number }> = [
    { type: "24h", fromMins: 23 * 60, toMins: 25 * 60 },
    { type: "1h", fromMins: 45, toMins: 75 },
  ];

  let sent = 0;
  let skipped = 0;

  for (const window of windows) {
    const windowStart = new Date(now.getTime() + window.fromMins * 60_000).toISOString();
    const windowEnd = new Date(now.getTime() + window.toMins * 60_000).toISOString();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_id,
        start_at,
        service:service_id (name),
        barber:barber_id (display_name, first_name)
      `)
      .eq("status", "scheduled")
      .not("customer_id", "is", null)
      .gte("start_at", windowStart)
      .lt("start_at", windowEnd);

    if (error) {
      console.error(`Failed to query bookings for ${window.type} window`, error);
      continue;
    }

    if (!bookings?.length) continue;

    for (const booking of bookings as Booking[]) {
      // Check if reminder already sent for this booking + type
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", booking.customer_id)
        .contains("data", { bookingId: booking.id, reminder: window.type })
        .limit(1)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const serviceName = booking.service?.name ?? "appointment";
      const barberName =
        booking.barber?.display_name?.trim() ||
        booking.barber?.first_name?.trim() ||
        "your barber";

      const appointmentDate = new Date(booking.start_at);
      const timeLabel = timeFormatter.format(appointmentDate);
      const dateLabel = dateFormatter.format(appointmentDate);

      const messages: Record<ReminderType, { title: string; body: string }> = {
        "24h": {
          title: "Appointment tomorrow",
          body: `Your ${serviceName} with ${barberName} is tomorrow at ${timeLabel}.`,
        },
        "1h": {
          title: "Appointment in 1 hour",
          body: `Your ${serviceName} with ${barberName} is at ${timeLabel} today (${dateLabel}).`,
        },
      };

      const { title, body } = messages[window.type];
      const data = { bookingId: booking.id, reminder: window.type };

      // Save notification record
      await supabase.from("notifications").insert({
        user_id: booking.customer_id,
        title,
        body,
        data,
      });

      // Fetch device tokens
      const { data: tokenRows } = await supabase
        .from("device_tokens")
        .select("token")
        .eq("user_id", booking.customer_id);

      if (tokenRows?.length) {
        const pushMessages = tokenRows.map(({ token }: { token: string }) => ({
          to: token,
          title,
          body,
          data,
          sound: "default",
        }));

        for (let i = 0; i < pushMessages.length; i += CHUNK_SIZE) {
          const chunk = pushMessages.slice(i, i + CHUNK_SIZE);
          try {
            const res = await fetch(EXPO_PUSH_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify(chunk),
            });
            const json = await res.json();
            const errors = json.data?.filter(
              (t: { status: string }) => t.status === "error",
            );
            if (errors?.length) {
              console.error("Push tickets with errors", JSON.stringify(errors));
            }
          } catch (err) {
            console.error("Push send failed", err);
          }
        }
      }

      sent++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, skipped }),
    { headers: { "Content-Type": "application/json" } },
  );
});
