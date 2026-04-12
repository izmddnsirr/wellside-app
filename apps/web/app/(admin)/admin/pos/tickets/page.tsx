import { Suspense } from "react";
import { AdminShell } from "../../components/admin-shell";

export const revalidate = 30;
import { Skeleton } from "@/components/ui/skeleton";
import { createAdminClient } from "@/utils/supabase/server";
import { TicketsTableClient } from "./tickets-table-client";

async function TicketsContent() {
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
      barber:barber_id (display_name, first_name, last_name),
      ticket_items (
        qty,
        unit_price,
        services:service_id (name, base_price),
        products:product_id (name, base_price)
      )
    `
    )
    .order("created_at", { ascending: false });

  const errorMessage = error
    ? "Failed to load tickets. Please try again."
    : null;
  const normalizedTickets = (tickets ?? []).map((ticket) => ({
    ...ticket,
    barber: Array.isArray(ticket.barber)
      ? ticket.barber[0] ?? null
      : ticket.barber ?? null,
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

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  return <TicketsTableClient tickets={normalizedTickets} />;
}

function TicketsSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Ticket history">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<TicketsSkeleton />}>
          <TicketsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
