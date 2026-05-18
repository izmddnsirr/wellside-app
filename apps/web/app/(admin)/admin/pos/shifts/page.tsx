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

async function ShiftsContent() {
  const supabase = await createAdminClient();
  const { data: shifts } = await supabase
    .from("shifts")
    .select(
      "id, shift_code, label, start_at, end_at, status, opened_by, profiles:opened_by (first_name, last_name)"
    )
    .order("start_at", { ascending: false });

  const normalizedShifts = (shifts ?? []).map((shift) => ({
    ...shift,
    profiles: Array.isArray(shift.profiles)
      ? shift.profiles[0] ?? null
      : shift.profiles ?? null,
  }));

  const shiftIds = normalizedShifts.map((shift) => shift.id);
  const { data: tickets } =
    shiftIds.length > 0
      ? await supabase
          .from("tickets")
          .select(
            `
            shift_id,
            total_amount,
            payment_status,
            payment_method,
            barber:barber_id (display_name, first_name, last_name),
            ticket_items (
              qty,
              unit_price,
              services:service_id (name, base_price),
              products:product_id (name, base_price)
            )
          `
          )
          .in("shift_id", shiftIds)
      : { data: [] };
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

  const paidTickets = normalizedTickets.filter(
    (ticket) => (ticket.payment_status ?? "").toLowerCase() === "paid"
  );

  const salesByShift = paidTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      if (!ticket.shift_id) {
        return acc;
      }
      acc[ticket.shift_id] =
        (acc[ticket.shift_id] ?? 0) + Number(ticket.total_amount ?? 0);
      return acc;
    },
    {}
  );

  const refundedTickets = normalizedTickets.filter(
    (ticket) => (ticket.payment_status ?? "").toLowerCase() === "refunded"
  );

  const cashSalesByShift = paidTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      if (!ticket.shift_id) {
        return acc;
      }
      const method = (ticket.payment_method ?? "").toLowerCase();
      if (method !== "cash") {
        return acc;
      }
      acc[ticket.shift_id] =
        (acc[ticket.shift_id] ?? 0) + Number(ticket.total_amount ?? 0);
      return acc;
    },
    {}
  );

  const ewalletSalesByShift = paidTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      if (!ticket.shift_id) {
        return acc;
      }
      const method = (ticket.payment_method ?? "").toLowerCase();
      if (method !== "ewallet") {
        return acc;
      }
      acc[ticket.shift_id] =
        (acc[ticket.shift_id] ?? 0) + Number(ticket.total_amount ?? 0);
      return acc;
    },
    {}
  );

  const refundedSalesByShift = refundedTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      if (!ticket.shift_id) {
        return acc;
      }
      acc[ticket.shift_id] =
        (acc[ticket.shift_id] ?? 0) + Number(ticket.total_amount ?? 0);
      return acc;
    },
    {}
  );

  const ticketsCountByShift = normalizedTickets.reduce<Record<string, number>>(
    (acc, ticket) => {
      if (!ticket.shift_id) {
        return acc;
      }
      acc[ticket.shift_id] = (acc[ticket.shift_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const itemsByShiftMap = normalizedTickets.reduce<
    Record<
      string,
      Map<
        string,
        { key: string; label: string; type: "service" | "product"; qty: number; total: number }
      >
    >
  >((acc, ticket) => {
    if (!ticket.shift_id || !ticket.ticket_items) {
      return acc;
    }
    const shiftItems = acc[ticket.shift_id] ?? new Map();
    ticket.ticket_items.forEach((item) => {
      const detail = item.services ?? item.products;
      if (!detail?.name) {
        return;
      }
      const type = item.services ? "service" : "product";
      const key = `${type}:${detail.name}`;
      const qty = item.qty ?? 0;
      const price =
        typeof item.unit_price === "number"
          ? item.unit_price
          : detail.base_price ?? 0;
      const existing =
        shiftItems.get(key) ?? {
          key,
          label: detail.name,
          type,
          qty: 0,
          total: 0,
        };
      existing.qty += qty;
      existing.total += qty * price;
      shiftItems.set(key, existing);
    });
    acc[ticket.shift_id] = shiftItems;
    return acc;
  }, {});

  const itemsByShift = Object.fromEntries(
    Object.entries(itemsByShiftMap).map(([shiftId, items]) => [
      shiftId,
      Array.from(items.values()).sort((a, b) =>
        a.total === b.total ? a.label.localeCompare(b.label) : b.total - a.total
      ),
    ])
  );

  const barberSalesByShiftMap = paidTickets.reduce<
    Record<
      string,
      Map<
        string,
        {
          key: string;
          label: string;
          total: number;
        }
      >
    >
  >((acc, ticket) => {
    if (!ticket.shift_id || !ticket.ticket_items?.length) {
      return acc;
    }

    const barberName =
      ticket.barber?.display_name ||
      [ticket.barber?.first_name, ticket.barber?.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Unknown";

    const shiftBarberSales = acc[ticket.shift_id] ?? new Map();
    const serviceTotal = ticket.ticket_items.reduce((sum, item) => {
      if (!item.services) {
        return sum;
      }
      const qty = item.qty ?? 0;
      const price =
        typeof item.unit_price === "number"
          ? item.unit_price
          : item.services.base_price ?? 0;
      return sum + qty * price;
    }, 0);

    if (serviceTotal <= 0) {
      acc[ticket.shift_id] = shiftBarberSales;
      return acc;
    }

    const existing = shiftBarberSales.get(barberName) ?? {
      key: barberName,
      label: barberName,
      total: 0,
    };
    existing.total += serviceTotal;
    shiftBarberSales.set(barberName, existing);
    acc[ticket.shift_id] = shiftBarberSales;
    return acc;
  }, {});

  const barberSalesByShift = Object.fromEntries(
    Object.entries(barberSalesByShiftMap).map(([shiftId, barbers]) => [
      shiftId,
      Array.from(barbers.values()).sort((a, b) =>
        a.total === b.total ? a.label.localeCompare(b.label) : b.total - a.total
      ),
    ])
  );

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
