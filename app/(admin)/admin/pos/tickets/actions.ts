"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";

export const deleteTicket = async (ticketId: string) => {
  try {
    if (!ticketId) {
      return { ok: false, error: "Ticket ID is required." };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

    if (error) {
      console.error("Failed to delete ticket", error);
      return {
        ok: false,
        error: error.message || error.details || "Failed to delete ticket.",
      };
    }

    revalidatePath("/admin/pos/tickets");
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete ticket", error);
    return { ok: false, error: "Failed to delete ticket." };
  }
};
