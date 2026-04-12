import { Suspense } from "react";
import { AdminShell } from "../components/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from "next/cache";

export const revalidate = 60;
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/server";
import { CustomersCard } from "./customers-card";

const updateCustomerStatus = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const statusValue = String(formData.get("is_active") ?? "");

  if (!id) {
    redirect("/admin/customers?toast=customer-update-invalid");
  }

  const isActive = statusValue === "active";
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Failed to update customer status", error);
    redirect("/admin/customers?toast=customer-update-error");
  }

  revalidatePath("/admin/customers");
  redirect("/admin/customers?toast=customer-update-success");
};

async function CustomersContent() {
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
    <CustomersCard
      customers={customers ?? []}
      errorMessage={errorMessage}
      updateCustomerStatus={updateCustomerStatus}
    />
  );
}

function CustomersSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-28" />
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
    <AdminShell title="Customers">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<CustomersSkeleton />}>
          <CustomersContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
