import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/server";

export type QueueEntry = {
  id: string;
  shop_date: string;
  queue_number: number;
  name: string;
  phone: string;
  status: "waiting" | "serving" | "done" | "cancelled";
  created_at: string;
  started_at: string | null;
};

const malaysiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getMalaysiaToday = () => malaysiaDateFormatter.format(new Date());

export const getTodayQueueEntries = async (): Promise<QueueEntry[]> => {
  const supabase = await createAdminClient();
  const today = getMalaysiaToday();

  const { data } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("shop_date", today)
    .in("status", ["waiting", "serving"])
    .order("queue_number", { ascending: true });

  return (data ?? []) as QueueEntry[];
};

export const joinQueue = async (
  name: string,
  phone: string,
): Promise<{ queueNumber: number; waitingAhead: number } | { error: string }> => {
  const supabase = await createClient();
  const today = getMalaysiaToday();

  // Get next queue number
  const { data: existing } = await supabase
    .from("queue_entries")
    .select("queue_number")
    .eq("shop_date", today)
    .order("queue_number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].queue_number + 1 : 1;

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      shop_date: today,
      queue_number: nextNumber,
      name: name.trim(),
      phone: phone.trim(),
      status: "waiting",
    })
    .select("queue_number")
    .single();

  if (error || !data) {
    return { error: "Failed to join queue. Please try again." };
  }

  // Count people waiting ahead
  const { count } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("shop_date", today)
    .eq("status", "waiting")
    .lt("queue_number", data.queue_number);

  return {
    queueNumber: data.queue_number,
    waitingAhead: count ?? 0,
  };
};
