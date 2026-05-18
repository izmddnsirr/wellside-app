import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "../components/admin-shell";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { createAdminClient } from "@/utils/supabase/server";
import { loadShopOperatingRules } from "@/utils/shop-operations";
import { OperationsSettingsPanel } from "./operations-settings-panel";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Customer Booking card */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
        <div className="p-6 pt-0">
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      {/* Weekly Schedule card */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Rest Time card */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>

      {/* Temporary Closures card */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="flex items-center justify-between gap-3 p-6 pb-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function SettingsContent() {
  const supabase = await createAdminClient();
  const adminSupabase = createAdminAuthClient();
  const operatingRules = await loadShopOperatingRules(adminSupabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff");
  }
  return (
    <OperationsSettingsPanel
      weeklySchedule={operatingRules.weeklySchedule}
      temporaryClosures={operatingRules.temporaryClosures}
      restWindows={operatingRules.restWindows}
      bookingEnabled={operatingRules.bookingEnabled}
    />
  );
}

export default function Page() {
  return (
    <AdminShell title="Settings">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
