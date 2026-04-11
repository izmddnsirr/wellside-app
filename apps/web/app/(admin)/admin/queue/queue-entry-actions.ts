"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";

export async function serveQueueEntry(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "serving", started_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("serveQueueEntry failed", error);
  revalidatePath("/admin/queue");
}

export async function completeQueueEntry(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "done" })
    .eq("id", id);
  if (error) console.error("completeQueueEntry failed", error);
  revalidatePath("/admin/queue");
}

export async function undoServeQueueEntry(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "waiting", started_at: null })
    .eq("id", id);
  if (error) console.error("undoServeQueueEntry failed", error);
  revalidatePath("/admin/queue");
}

export async function removeQueueEntry(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) console.error("removeQueueEntry failed", error);
  revalidatePath("/admin/queue");
}
