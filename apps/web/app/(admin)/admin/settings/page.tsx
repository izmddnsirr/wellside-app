import { redirect } from "next/navigation";
import { AdminShell } from "../components/admin-shell";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { createAdminClient } from "@/utils/supabase/server";
import { loadShopOperatingRules } from "@/utils/shop-operations";
import { OperationsSettingsPanel } from "./operations-settings-panel";

export default async function SettingsPage() {
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
    <AdminShell title="Settings">
      <div className="px-4 lg:px-6">
        <OperationsSettingsPanel
          weeklySchedule={operatingRules.weeklySchedule}
          temporaryClosures={operatingRules.temporaryClosures}
          restWindows={operatingRules.restWindows}
          bookingEnabled={operatingRules.bookingEnabled}
        />
      </div>
    </AdminShell>
  );
}
