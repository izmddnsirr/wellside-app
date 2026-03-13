import { AdminShell } from "../components/admin-shell";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/server";
import { CustomersCard } from "./customers-card";

const updateCustomerStatus = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const statusValue = String(formData.get("is_active") ?? "");

  if (!id) {
    return;
  }

  const isActive = statusValue === "active";
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Failed to update customer status", error);
    return;
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
};

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: customers, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone, is_active, created_at, role",
    )
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load customers. Please try again."
    : null;

  return (
    <AdminShell title="Customers">
      <div className="px-4 lg:px-6">
        <CustomersCard
          customers={customers ?? []}
          errorMessage={errorMessage}
          updateCustomerStatus={updateCustomerStatus}
        />
      </div>
    </AdminShell>
  );
}
