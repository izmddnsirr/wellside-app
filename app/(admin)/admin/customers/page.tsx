import { AdminShell } from "../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { CustomersCard } from "./customers-card";

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: customers, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, is_active, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load customers. Please try again."
    : null;

  return (
    <AdminShell
      title="Customers"
      description="Track customer profiles and engagement."
    >
      <div className="px-4 lg:px-6">
        <CustomersCard customers={customers ?? []} errorMessage={errorMessage} />
      </div>
    </AdminShell>
  );
}
