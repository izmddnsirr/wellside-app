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

export const refundTicket = async (ticketId: string) => {
  try {
    if (!ticketId) {
      return { ok: false, error: "Ticket ID is required." };
    }

    const supabase = await createAdminClient();
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("payment_status, total_amount")
      .eq("id", ticketId)
      .maybeSingle();

    if (ticketError) {
      console.error("Failed to load ticket", ticketError);
      return { ok: false, error: "Failed to load ticket." };
    }

    if (!ticket) {
      return { ok: false, error: "Ticket not found." };
    }

    if (ticket.payment_status !== "paid") {
      return { ok: false, error: "Only paid tickets can be refunded." };
    }

    const totalAmount =
      typeof ticket.total_amount === "number"
        ? ticket.total_amount
        : Number(ticket.total_amount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return { ok: false, error: "Ticket total is invalid." };
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        payment_status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_amount: totalAmount,
      })
      .eq("id", ticketId)
      .eq("payment_status", "paid");

    if (error) {
      console.error("Failed to refund ticket", error);
      return {
        ok: false,
        error: error.message || error.details || "Failed to refund ticket.",
      };
    }

    revalidatePath("/admin/pos/tickets");
    return { ok: true };
  } catch (error) {
    console.error("Failed to refund ticket", error);
    return { ok: false, error: "Failed to refund ticket." };
  }
};
