import { AdminShell } from "../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { BarbersCard } from "./barbers-card";

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: barbers, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone, is_active, created_at, working_start_time, working_end_time, barber_level"
    )
    .eq("role", "barber")
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load barbers. Please try again."
    : null;

  return (
    <AdminShell
      title="Barbers"
      description="Manage staff schedules and performance."
    >
      <div className="px-4 lg:px-6">
        <BarbersCard barbers={barbers ?? []} errorMessage={errorMessage} />
      </div>
    </AdminShell>
  );
}
