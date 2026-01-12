"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";

export const deleteShift = async (shiftId: string) => {
  try {
    if (!shiftId) {
      return { ok: false, error: "Shift ID is required." };
    }

    const supabase = await createAdminClient();
    const { error: ticketsDeleteError } = await supabase
      .from("tickets")
      .delete()
      .eq("shift_id", shiftId);

    if (ticketsDeleteError) {
      console.error("Failed to delete tickets", ticketsDeleteError);
      return {
        ok: false,
        error:
          ticketsDeleteError.message ||
          ticketsDeleteError.details ||
          "Failed to delete tickets.",
      };
    }

    const { error: shiftError } = await supabase
      .from("shifts")
      .delete()
      .eq("id", shiftId);

    if (shiftError) {
      console.error("Failed to delete shift", shiftError);
      return { ok: false, error: "Failed to delete shift." };
    }

    revalidatePath("/admin/pos/shifts");
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete shift", error);
    return { ok: false, error: "Failed to delete shift." };
  }
};
