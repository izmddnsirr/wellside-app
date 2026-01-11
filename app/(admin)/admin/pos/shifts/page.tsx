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
          .select("shift_id, total_amount")
          .in("shift_id", shiftIds)
      : { data: [] };
  const salesByShift = (tickets ?? []).reduce<Record<string, number>>(
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

  return (
    <AdminShell title="Shift history" description="Past shifts and totals.">
      <div className="px-4 lg:px-6">
        <ShiftsTable shifts={normalizedShifts} salesByShift={salesByShift} />
      </div>
    </AdminShell>
  );
}
