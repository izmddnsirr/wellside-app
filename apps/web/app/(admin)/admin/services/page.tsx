import { Suspense } from "react";
import { AdminShell } from "../components/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ServicesCard } from "./services-card";
import { createAdminClient } from "@/utils/supabase/server";

export const revalidate = 60;

const createService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price") ?? "").trim();
  const basePrice = basePriceRaw === "" ? null : Number(basePriceRaw);
  const duration = Number(formData.get("duration_minutes"));
  const isActive = formData.get("is_active") === "on";
  const allowBooking = formData.get("allow_booking") !== "off";

  if (
    !name ||
    Number.isNaN(duration) ||
    (basePriceRaw !== "" && Number.isNaN(basePrice)) ||
    (basePrice !== null && basePrice <= 0)
  ) {
    return;
  }

  const { error } = await supabase.from("services").insert({
    name,
    base_price: basePrice,
    duration_minutes: duration,
    is_active: isActive,
    allow_booking: allowBooking,
  });

  if (error) {
    console.error("Failed to create service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services?toast=service-created");
};

const updateService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price") ?? "").trim();
  const basePrice = basePriceRaw === "" ? null : Number(basePriceRaw);
  const duration = Number(formData.get("duration_minutes"));
  const isActive = formData.get("is_active") === "on";
  const allowBooking = formData.get("allow_booking") !== "off";

  if (
    !id ||
    !name ||
    Number.isNaN(duration) ||
    (basePriceRaw !== "" && Number.isNaN(basePrice)) ||
    (basePrice !== null && basePrice <= 0)
  ) {
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({
      name,
      base_price: basePrice,
      duration_minutes: duration,
      is_active: isActive,
      allow_booking: allowBooking,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services?toast=service-updated");
};

const updateServiceBooking = async ({
  id,
  allowBooking,
}: {
  id: string;
  allowBooking: boolean;
}) => {
  "use server";
  const supabase = await createAdminClient();

  if (!id) {
    return { ok: false, message: "Invalid service id." };
  }

  const { error } = await supabase
    .from("services")
    .update({ allow_booking: allowBooking })
    .eq("id", id);

  if (error) {
    console.error("Failed to update booking availability", error);
    return { ok: false, message: "Failed to update booking availability." };
  }

  revalidatePath("/admin/services");
  return { ok: true };
};

const archiveService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id);
  if (error) {
    console.error("Failed to deactivate service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services?toast=service-deactivated");
};

const reactivateService = async (formData: FormData) => {
  "use server";
  const supabase = await createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({ is_active: true })
    .eq("id", id);
  if (error) {
    console.error("Failed to reactivate service", error);
    return;
  }

  revalidatePath("/admin/services");
  redirect("/admin/services?toast=service-reactivated");
};

async function ServicesContent() {
  const supabase = await createAdminClient();
  const { data: services, error } = await supabase
    .from("services")
    .select(
      "id, name, service_code, base_price, duration_minutes, is_active, allow_booking, created_at",
    )
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load services. Please try again."
    : null;

  return (
    <ServicesCard
      services={services ?? []}
      errorMessage={errorMessage}
      createService={createService}
      updateService={updateService}
      updateServiceBooking={updateServiceBooking}
      archiveService={archiveService}
      reactivateService={reactivateService}
    />
  );
}

function ServicesSkeleton() {
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
    <AdminShell title="Services">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<ServicesSkeleton />}>
          <ServicesContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
