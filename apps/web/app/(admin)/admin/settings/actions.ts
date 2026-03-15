"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    redirect("/admin/settings?toast=settings-weekly-error");
  }

  revalidateSettings();
  redirect("/admin/settings?toast=settings-weekly-saved");
};

export const addTemporaryClosure = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;
  const closureTypeInput = String(formData.get("closure_type") ?? "closed");
  const closureType =
    closureTypeInput === "holiday" ? "holiday" : "closed";
  const repeatAnnually = formData.get("repeat_annually") === "on";

  if (!startDate || !endDate || startDate > endDate) {
    redirect("/admin/settings?toast=settings-closure-invalid");
  }

  const { error } = await supabase.from("shop_temporary_closures").insert({
    start_date: startDate,
    end_date: endDate,
    reason,
    closure_type: closureType,
    repeat_annually: repeatAnnually,
    is_active: true,
  });

  if (error) {
    console.error("Failed to add temporary closure", error);
    redirect("/admin/settings?toast=settings-closure-error");
  }

  revalidateSettings();
  redirect("/admin/settings?toast=settings-closure-added");
};

export const deleteTemporaryClosure = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const closureId = String(formData.get("closure_id") ?? "");

  if (!closureId) {
    redirect("/admin/settings?toast=settings-closure-invalid");
  }

  const { error } = await supabase
    .from("shop_temporary_closures")
    .update({ is_active: false })
    .eq("id", closureId);

  if (error) {
    console.error("Failed to delete temporary closure", error);
    redirect("/admin/settings?toast=settings-closure-error");
  }

  revalidateSettings();
  redirect("/admin/settings?toast=settings-closure-removed");
};

export const addRestWindow = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const reason = reasonRaw.length > 0 ? reasonRaw : null;

  if (!startTime || !endTime || startTime === endTime) {
    redirect("/admin/settings?toast=settings-rest-invalid");
  }

  const { error } = await supabase.from("shop_rest_windows").insert({
    start_time: startTime,
    end_time: endTime,
    reason,
    is_active: true,
  });

  if (error) {
    console.error("Failed to add rest window", error);
    redirect("/admin/settings?toast=settings-rest-error");
  }

  revalidateSettings();
  redirect("/admin/settings?toast=settings-rest-added");
};

export const deleteRestWindow = async (formData: FormData) => {
  const supabase = createAdminAuthClient();
  const restWindowId = String(formData.get("rest_window_id") ?? "");

  if (!restWindowId) {
    redirect("/admin/settings?toast=settings-rest-invalid");
  }

  const { error } = await supabase
    .from("shop_rest_windows")
    .update({ is_active: false })
    .eq("id", restWindowId);

  if (error) {
    console.error("Failed to remove rest window", error);
    redirect("/admin/settings?toast=settings-rest-error");
  }

  revalidateSettings();
  redirect("/admin/settings?toast=settings-rest-removed");
};
