import { Suspense } from "react";
import { BarberShell } from "../components/barber-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { createBarberClient } from "@/utils/supabase/server";
import { BarberTicketsClient } from "./tickets-client";

export const dynamic = "force-dynamic";

async function TicketsContent() {
  const supabase = await createBarberClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-sm text-muted-foreground">Not authenticated.</p>;
  }

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
      ticket_items (
        qty,
        unit_price,
        services:service_id (name),
        products:product_id (name)
      )
    `
    )
    .eq("barber_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-sm text-red-600">Failed to load tickets.</p>;
  }

  const normalizedTickets = (tickets ?? []).map((ticket) => ({
    ...ticket,
    ticket_items:
      ticket.ticket_items?.map((item) => ({
        ...item,
        services: Array.isArray(item.services)
          ? item.services[0] ?? null
          : item.services ?? null,
        products: Array.isArray(item.products)
          ? item.products[0] ?? null
          : item.products ?? null,
      })) ?? [],
  }));

  const paidTickets = normalizedTickets.filter(
    (t) => t.payment_status === "paid",
  );
  const totalEarnings = paidTickets.reduce(
    (sum, t) => sum + (t.total_amount ?? 0),
    0,
  );
  const cashEarnings = paidTickets
    .filter((t) => t.payment_method === "cash")
    .reduce((sum, t) => sum + (t.total_amount ?? 0), 0);
  const ewalletEarnings = paidTickets
    .filter((t) => t.payment_method === "ewallet")
    .reduce((sum, t) => sum + (t.total_amount ?? 0), 0);

  return (
    <BarberTicketsClient
      tickets={normalizedTickets}
      totalEarnings={totalEarnings}
      cashEarnings={cashEarnings}
      ewalletEarnings={ewalletEarnings}
    />
  );
}

function TicketsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-4 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <BarberShell title="Tickets">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<TicketsSkeleton />}>
          <TicketsContent />
        </Suspense>
      </div>
    </BarberShell>
  );
}
