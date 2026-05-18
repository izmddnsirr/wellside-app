"use server";

import { broadcastPush, sendPushToUser } from "@/utils/push";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

type Result = { ok: boolean; sent?: number; error?: string };

// ── Broadcast ────────────────────────────────────────────────────────────────

export async function broadcastNotification(formData: FormData): Promise<Result> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) return { ok: false, error: "Title and message are required." };
  if (title.length > 100) return { ok: false, error: "Title must be 100 characters or less." };
  if (body.length > 300) return { ok: false, error: "Message must be 300 characters or less." };

  try {
    const { sent } = await broadcastPush(title, body);
    revalidatePath("/admin/notifications");
    return { ok: true, sent };
  } catch (err) {
    console.error("Broadcast notification failed", err);
    return { ok: false, error: "Failed to send notification. Try again." };
  }
}

// ── Send to specific user ────────────────────────────────────────────────────

export async function sendToUser(formData: FormData): Promise<Result> {
  const userId = String(formData.get("userId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!userId) return { ok: false, error: "Please select a user." };
  if (!title || !body) return { ok: false, error: "Title and message are required." };
  if (title.length > 100) return { ok: false, error: "Title must be 100 characters or less." };
  if (body.length > 300) return { ok: false, error: "Message must be 300 characters or less." };

  try {
    await sendPushToUser(userId, title, body);
    revalidatePath("/admin/notifications");
    return { ok: true, sent: 1 };
  } catch (err) {
    console.error("Send to user failed", err);
    return { ok: false, error: "Failed to send notification. Try again." };
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function saveTemplate(formData: FormData): Promise<Result> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) return { ok: false, error: "Title and message are required." };

  const supabase = createAdminAuthClient();
  const { error } = await supabase.from("notification_templates").insert({ title, body });

  if (error) return { ok: false, error: "Failed to save template." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function deleteTemplate(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Invalid template." };

  const supabase = createAdminAuthClient();
  const { error } = await supabase.from("notification_templates").delete().eq("id", id);

  if (error) return { ok: false, error: "Failed to delete template." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}

// ── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleNotification(formData: FormData): Promise<Result> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();

  if (!title || !body) return { ok: false, error: "Title and message are required." };
  if (!scheduledAt) return { ok: false, error: "Please select a date and time." };

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime()) || date <= new Date()) {
    return { ok: false, error: "Scheduled time must be in the future." };
  }

  const supabase = createAdminAuthClient();
  const { error } = await supabase.from("scheduled_notifications").insert({
    title,
    body,
    scheduled_at: date.toISOString(),
    status: "pending",
  });

  if (error) return { ok: false, error: "Failed to schedule notification." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function cancelScheduled(formData: FormData): Promise<Result> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Invalid notification." };

  const supabase = createAdminAuthClient();
  const { error } = await supabase
    .from("scheduled_notifications")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, error: "Failed to cancel." };
  revalidatePath("/admin/notifications");
  return { ok: true };
}
