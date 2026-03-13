import { redirect } from "next/navigation";
import { AdminShell } from "../components/admin-shell";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { createAdminClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Control how updates reach you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3">
                  <Checkbox id="notify-bookings" defaultChecked />
                  <Label
                    htmlFor="notify-bookings"
                    className="space-y-1 leading-5"
                  >
                    <span className="font-medium">Booking updates</span>
                    <span className="block text-xs text-muted-foreground">
                      Receive alerts when bookings are created or updated.
                    </span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="notify-staff" defaultChecked />
                  <Label htmlFor="notify-staff" className="space-y-1 leading-5">
                    <span className="font-medium">Staff activity</span>
                    <span className="block text-xs text-muted-foreground">
                      Get notified when staff status changes.
                    </span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="notify-reports" />
                  <Label
                    htmlFor="notify-reports"
                    className="space-y-1 leading-5"
                  >
                    <span className="font-medium">Weekly reports</span>
                    <span className="block text-xs text-muted-foreground">
                      Summary of revenue and performance.
                    </span>
                  </Label>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Settings sync will be added soon.
                  </p>
                  <Button type="button" disabled>
                    Save settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <OperationsSettingsPanel
              weeklySchedule={operatingRules.weeklySchedule}
              temporaryClosures={operatingRules.temporaryClosures}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System</CardTitle>
                <CardDescription>
                  Admin environment preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Audit logs, exports, and integrations will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
