"use server";

import { broadcastPush } from "@/utils/push";

type BroadcastResult = {
  ok: boolean;
  sent?: number;
  error?: string;
};

export async function broadcastNotification(
  formData: FormData,
): Promise<BroadcastResult> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    return { ok: false, error: "Title and message are required." };
  }

  if (title.length > 100) {
    return { ok: false, error: "Title must be 100 characters or less." };
  }

  if (body.length > 300) {
    return { ok: false, error: "Message must be 300 characters or less." };
  }

  try {
    const { sent } = await broadcastPush(title, body);
    return { ok: true, sent };
  } catch (err) {
    console.error("Broadcast notification failed", err);
    return { ok: false, error: "Failed to send notification. Try again." };
  }
}
