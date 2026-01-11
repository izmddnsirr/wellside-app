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
      paid_at,
      created_at,
      shifts:shift_id (shift_code, label),
      ticket_items (
        qty,
        services:service_id (name),
        products:product_id (name)
      )
    `
    )
    .order("created_at", { ascending: false });

  const errorMessage = error
    ? "Failed to load tickets. Please try again."
    : null;

  return (
    <AdminShell title="Ticket history" description="All recorded tickets.">
      <div className="px-4 lg:px-6">
        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : (
          <TicketsTable tickets={tickets ?? []} />
        )}
      </div>
    </AdminShell>
  );
}
