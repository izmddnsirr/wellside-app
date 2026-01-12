"use server";

import { createAdminClient } from "@/utils/supabase/server";

type TicketItemInput = {
  item_type: "service" | "product";
  service_id: string | null;
  product_id: string | null;
  qty: number;
  unit_price: number;
};

type CreateUnpaidTicketInput = {
  shiftId: string;
  barberId: string | null;
  items: TicketItemInput[];
};

type PayTicketInput = {
  ticketId: string;
  paymentMethod: "cash" | "ewallet";
  cashReceived?: number | null;
};

export const createUnpaidTicket = async (input: CreateUnpaidTicketInput) => {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc(
      "create_unpaid_ticket_with_items",
      {
        shift_id: input.shiftId,
        barber_id: input.barberId ?? null,
        items: input.items,
      }
    );

    if (error) {
      console.error("Failed to create unpaid ticket", error);
      return {
        ok: false,
        error:
          error.message || error.details || "Failed to create unpaid ticket.",
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      ok: true,
      ticketId: (row?.ticket_id ?? null) as string | null,
      ticketNo:
        (row as { ticket_no_out?: string | null } | null)?.ticket_no_out ?? null,
    };
  } catch (error) {
    console.error("Failed to create unpaid ticket", error);
    return { ok: false, error: "Failed to create unpaid ticket." };
  }
};

export const payTicket = async (input: PayTicketInput) => {
  try {
    const supabase = await createAdminClient();
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("total_amount, payment_status")
      .eq("id", input.ticketId)
      .maybeSingle();

    if (ticketError) {
      console.error("Failed to load ticket total", ticketError);
      return { ok: false, error: "Failed to load ticket total." };
    }

    if (!ticket) {
      return { ok: false, error: "Ticket not found." };
    }

    if (ticket.payment_status && ticket.payment_status !== "unpaid") {
      return { ok: false, error: "Ticket is already paid or refunded." };
    }

    if (typeof ticket.total_amount !== "number") {
      return { ok: false, error: "Ticket total is unavailable." };
    }

    const updatePayload: {
      payment_status: "paid";
      payment_method: "cash" | "ewallet";
      paid_at: string;
      cash_received?: number | null;
      change_due?: number | null;
    } = {
      payment_status: "paid",
      payment_method: input.paymentMethod,
      paid_at: new Date().toISOString(),
    };

    if (input.paymentMethod === "cash") {
      const cashReceived =
        typeof input.cashReceived === "number"
          ? input.cashReceived
          : Number(input.cashReceived);
      if (!Number.isFinite(cashReceived)) {
        return { ok: false, error: "Cash received is required." };
      }
      if (cashReceived < ticket.total_amount) {
        return { ok: false, error: "Cash received is insufficient." };
      }
      updatePayload.cash_received = cashReceived;
      updatePayload.change_due = cashReceived - ticket.total_amount;
    } else {
      updatePayload.cash_received = null;
      updatePayload.change_due = 0;
    }

    const { data, error } = await supabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", input.ticketId)
      .eq("payment_status", "unpaid")
      .select("id");

    if (error) {
      console.error("Failed to pay ticket", error);
      return {
        ok: false,
        error: error.message || error.details || "Failed to pay ticket.",
      };
    }

    if (!data || data.length === 0) {
      return { ok: false, error: "Ticket is already paid or refunded." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to pay ticket", error);
    return { ok: false, error: "Failed to pay ticket." };
  }
};
