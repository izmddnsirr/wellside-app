import { redirect } from "next/navigation";
import { AdminShell } from "../components/admin-shell";
import { createAdminClient } from "@/utils/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

const buildInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default async function AccountPage() {
  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,email,phone,avatar_url")
    .eq("id", user.id)
    .maybeSingle()
    .returns<ProfileRow>();

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const email = profile?.email ?? user.email ?? "";
  const phone = profile?.phone ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const initials = buildInitials(fullName || email || "Admin");

  return (
    <AdminShell title="Account">
      <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Keep your contact details up to date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={fullName || "Admin"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{fullName || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{email || "-"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" defaultValue={firstName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" defaultValue={lastName} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={email} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex">
                  <div className="flex items-center gap-2 rounded-l-md border border-border bg-muted/40 px-3 text-sm font-medium text-foreground/80">
                    <span aria-hidden="true" className="text-base">
                      🇲🇾
                    </span>
                    <span className="text-sm">+60</span>
                  </div>
                  <Input
                    id="phone"
                    defaultValue={phone}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Profile updates will be available soon.
              </p>
              <Button type="button" disabled>
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage password and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">
                  Use a strong password to protect your account.
                </p>
              </div>
              <Button type="button" variant="outline" disabled>
                Change password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Appearance and accessibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Theme and layout options will appear here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
