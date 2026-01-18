import { AdminShell } from "../../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { TicketsTable } from "./tickets-table";

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      ticket_no,
      payment_status,
      payment_method,
      total_amount,
      cash_received,
      change_due,
      paid_at,
      created_at,
      shifts:shift_id (shift_code, label),
      ticket_items (
        qty,
        unit_price,
        services:service_id (name, price),
        products:product_id (name, price)
      )
    `
    )
    .order("created_at", { ascending: false });

  const errorMessage = error
    ? "Failed to load tickets. Please try again."
    : null;
  const normalizedTickets = (tickets ?? []).map((ticket) => ({
    ...ticket,
    shifts: Array.isArray(ticket.shifts)
      ? ticket.shifts[0] ?? null
      : ticket.shifts ?? null,
    ticket_items:
      ticket.ticket_items?.map((item) => ({
        ...item,
        services: Array.isArray(item.services)
          ? item.services[0] ?? null
          : item.services ?? null,
        products: Array.isArray(item.products)
          ? item.products[0] ?? null
          : item.products ?? null,
      })) ?? null,
  }));

  return (
    <AdminShell title="Ticket history" description="All recorded tickets.">
      <div className="px-4 lg:px-6">
        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : (
          <TicketsTable tickets={normalizedTickets} />
        )}
      </div>
    </AdminShell>
  );
}
