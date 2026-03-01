"use server";

import { revalidatePath } from "next/cache";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { WEEKDAY_KEYS } from "@/utils/shop-operations";

const revalidateSettings = () => {
  revalidatePath("/admin/settings");
};

export const saveWeeklySchedule = async (formData: FormData) => {
  const supabase = createAdminAuthClient();

  const rows = WEEKDAY_KEYS.map((weekday) => ({
    weekday,
    is_open: formData.get(weekday) === "on",
    is_active: true,
  }));

  const { error } = await supabase
    .from("shop_weekly_schedule")
    .upsert(rows, { onConflict: "weekday" });

  if (error) {
    console.error("Failed to save weekly schedule", error);
    return;
  }

  revalidateSettings();
};

export const addTemporaryClosure = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  if (!startDate || !endDate || startDate > endDate) {
    return;
  }

  const { error } = await supabase.from("shop_temporary_closures").insert({
    start_date: startDate,
    end_date: endDate,
    reason,
    is_active: true,
  });

  if (error) {
    console.error("Failed to add temporary closure", error);
    return;
  }

  revalidateSettings();
};

export const deleteTemporaryClosure = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const closureId = String(formData.get("closure_id") ?? "");

  if (!closureId) {
    return;
  }

  const { error } = await supabase
    .from("shop_temporary_closures")
    .update({ is_active: false })
    .eq("id", closureId);

  if (error) {
    console.error("Failed to delete temporary closure", error);
    return;
  }

  revalidateSettings();
};
