import { AdminShell } from "../../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { ShiftsTable } from "./shifts-table";

export default async function Page() {
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
            ticket_items (
              qty,
              services:service_id (name, price),
              products:product_id (name, price)
            )
          `
          )
          .in("shift_id", shiftIds)
      : { data: [] };
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
      })) ?? null,
  }));

  const salesByShift = normalizedTickets.reduce<Record<string, number>>(
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
      const price = detail.price ?? 0;
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

  return (
    <AdminShell title="Shift history" description="Past shifts and totals.">
      <div className="px-4 lg:px-6">
        <ShiftsTable
          shifts={normalizedShifts}
          salesByShift={salesByShift}
          ticketsCountByShift={ticketsCountByShift}
          itemsByShift={itemsByShift}
        />
      </div>
    </AdminShell>
  );
}
