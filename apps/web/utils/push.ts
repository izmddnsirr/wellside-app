import "server-only";
import { createAdminAuthClient } from "./supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

type ExpoTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

async function sendChunk(
  supabase: ReturnType<typeof createAdminAuthClient>,
  messages: Array<{ to: string; title: string; body: string; data?: Record<string, unknown>; sound: string }>,
  tokens: string[],
) {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const json = (await res.json()) as { data: ExpoTicket[] };
    const deadTokens: string[] = [];

    json.data?.forEach((ticket, i) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        deadTokens.push(tokens[i]);
      }
    });

    if (deadTokens.length) {
      await supabase
        .from("device_tokens")
        .delete()
        .in("token", deadTokens);
    }
  } catch (err) {
    console.error("Failed to send push notification chunk", err);
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const supabase = createAdminAuthClient();

  // Save to notifications table (shows in the mobile notification tab)
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    data: data ?? null,
  });

  // Fetch device tokens for this user
  const { data: tokenRows } = await supabase
    .from("device_tokens")
    .select("token")
    .eq("user_id", userId);

  if (!tokenRows?.length) return;

  const tokens = tokenRows.map(({ token }) => token);
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
  }));

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    await sendChunk(supabase, messages.slice(i, i + CHUNK_SIZE), tokens.slice(i, i + CHUNK_SIZE));
  }
}

// Broadcast a push notification to all users who have a device token
export async function broadcastPush(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ sent: number }> {
  const supabase = createAdminAuthClient();

  // Fetch all distinct user+token pairs
  const { data: tokenRows } = await supabase
    .from("device_tokens")
    .select("user_id, token");

  if (!tokenRows?.length) return { sent: 0 };

  // Group tokens by user so we can insert one notification record per user
  const byUser = new Map<string, string[]>();
  for (const { user_id, token } of tokenRows) {
    const existing = byUser.get(user_id) ?? [];
    existing.push(token);
    byUser.set(user_id, existing);
  }

  // Insert one notification row per user
  const notificationRows = Array.from(byUser.keys()).map((userId) => ({
    user_id: userId,
    title,
    body,
    data: data ?? null,
  }));
  await supabase.from("notifications").insert(notificationRows);

  // Send push to all tokens in chunks of 100
  const allTokens = tokenRows.map(({ token }) => token);
  const allMessages = allTokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
  }));

  for (let i = 0; i < allMessages.length; i += CHUNK_SIZE) {
    await sendChunk(supabase, allMessages.slice(i, i + CHUNK_SIZE), allTokens.slice(i, i + CHUNK_SIZE));
  }

  return { sent: byUser.size };
}
