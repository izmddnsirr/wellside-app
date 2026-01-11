import { AdminShell } from "../components/admin-shell";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ServicesCard } from "./services-card";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const createService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const duration = Number(formData.get("duration_minutes"));
  const isActive = formData.get("is_active") === "on";

  if (!name || Number.isNaN(price) || Number.isNaN(duration)) {
    return;
  }

  const { error } = await supabase.from("services").insert({
    name,
    price,
    duration_minutes: duration,
    is_active: isActive,
  });

  if (error) {
    console.error("Failed to create service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
};

const updateService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const duration = Number(formData.get("duration_minutes"));
  const isActive = formData.get("is_active") === "on";

  if (!id || !name || Number.isNaN(price) || Number.isNaN(duration)) {
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({
      name,
      price,
      duration_minutes: duration,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
};

const deleteService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services");
};

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: services, error } = await supabase
    .from("services")
    .select(
      "id, name, service_code, price, duration_minutes, is_active, created_at"
    )
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load services. Please try again."
    : null;

  return (
    <AdminShell
      title="Services"
      description="Maintain service menus, durations, and pricing."
    >
      <div className="px-4 lg:px-6">
        <ServicesCard
          services={services ?? []}
          errorMessage={errorMessage}
          createService={createService}
          updateService={updateService}
          deleteService={deleteService}
        />
      </div>
    </AdminShell>
  );
}
