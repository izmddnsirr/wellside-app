import { Suspense } from "react";
import { AdminShell } from "../../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { ShiftsTable } from "./shifts-table";
import { Skeleton } from "@/components/ui/skeleton";

function ShiftsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-37.5" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-45" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {/* Table header */}
        <div className="flex items-center gap-4 bg-muted/40 border-b border-border/60 px-4 py-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/60 bg-background px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

type ShiftStats = {
  shift_id: string;
  total_sales: number;
  cash_sales: number;
  ewallet_sales: number;
  refunded_sales: number;
  ticket_count: number;
  items: { key: string; label: string; type: "service" | "product"; qty: number; total: number }[];
  barber_sales: { key: string; label: string; total: number }[];
};

async function ShiftsContent() {
  const supabase = await createAdminClient();

  const [{ data: shifts }, { data: statsRows }] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, shift_code, label, start_at, end_at, status, opened_by, profiles:opened_by (first_name, last_name)")
      .order("start_at", { ascending: false }),
    supabase.rpc("get_shift_stats"),
  ]);

  const normalizedShifts = (shifts ?? []).map((shift) => ({
    ...shift,
    profiles: Array.isArray(shift.profiles)
      ? shift.profiles[0] ?? null
      : shift.profiles ?? null,
  }));

  const statsByShift = ((statsRows ?? []) as ShiftStats[]).reduce<Record<string, ShiftStats>>(
    (acc, row) => { acc[row.shift_id] = row; return acc; },
    {}
  );

  const salesByShift: Record<string, number> = {};
  const cashSalesByShift: Record<string, number> = {};
  const ewalletSalesByShift: Record<string, number> = {};
  const refundedSalesByShift: Record<string, number> = {};
  const ticketsCountByShift: Record<string, number> = {};
  const itemsByShift: Record<string, ShiftStats["items"]> = {};
  const barberSalesByShift: Record<string, ShiftStats["barber_sales"]> = {};

  for (const [id, s] of Object.entries(statsByShift)) {
    salesByShift[id] = Number(s.total_sales);
    cashSalesByShift[id] = Number(s.cash_sales);
    ewalletSalesByShift[id] = Number(s.ewallet_sales);
    refundedSalesByShift[id] = Number(s.refunded_sales);
    ticketsCountByShift[id] = Number(s.ticket_count);
    itemsByShift[id] = s.items;
    barberSalesByShift[id] = s.barber_sales;
  }

  return (
    <ShiftsTable
      shifts={normalizedShifts}
      salesByShift={salesByShift}
      cashSalesByShift={cashSalesByShift}
      ewalletSalesByShift={ewalletSalesByShift}
      refundedSalesByShift={refundedSalesByShift}
      ticketsCountByShift={ticketsCountByShift}
      barberSalesByShift={barberSalesByShift}
      itemsByShift={itemsByShift}
    />
  );
}

export default function Page() {
  return (
    <AdminShell title="Shift history">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<ShiftsSkeleton />}>
          <ShiftsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
