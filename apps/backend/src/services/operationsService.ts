import { createAdminClient } from "../lib/supabase";
import {
  WEEKDAY_KEYS,
  loadShopOperatingRules,
} from "../lib/shop-operations";

export async function getOperatingRules() {
  return loadShopOperatingRules(createAdminClient());
}

export async function saveWeeklySchedule(input: Partial<Record<string, boolean>>) {
  const supabase = createAdminClient();

  const rows = WEEKDAY_KEYS.map((weekday) => ({
    weekday,
    is_open: Boolean(input[weekday]),
    is_active: true,
  }));

  const { error } = await supabase
    .from("shop_weekly_schedule")
    .upsert(rows, { onConflict: "weekday" });

  if (error) {
    throw error;
  }

  return { ok: true };
}

export async function addTemporaryClosure(input: {
  start_date: string;
  end_date: string;
  reason?: string | null;
}) {
  const supabase = createAdminClient();
  const reasonRaw = String(input.reason ?? "").trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  if (!input.start_date || !input.end_date || input.start_date > input.end_date) {
    throw new Error("Invalid temporary closure range.");
  }

  const { error } = await supabase.from("shop_temporary_closures").insert({
    start_date: input.start_date,
    end_date: input.end_date,
    reason,
    is_active: true,
  });

  if (error) {
    throw error;
  }

  return { ok: true };
}

export async function deleteTemporaryClosure(closureId: string) {
  const supabase = createAdminClient();

  if (!closureId) {
    throw new Error("Missing closure id.");
  }

  const { error } = await supabase
    .from("shop_temporary_closures")
    .update({ is_active: false })
    .eq("id", closureId);

  if (error) {
    throw error;
  }

  return { ok: true };
}
