import type { ComponentProps } from "react";

import { createAdminClient } from "@/utils/supabase/server";
import { AppSidebarClient } from "./app-sidebar-client";
import type { Sidebar } from "@/components/ui/sidebar";

const fallbackUser = {
  name: "Admin",
  email: "wellside.inc@gmail.com",
  avatar: "",
};

type SidebarProps = ComponentProps<typeof Sidebar>;

export async function AppSidebar(props: SidebarProps) {
  const supabase = await createAdminClient();

  const [
    { data: { user: authUser } },
    { count: activeBookingsCount },
    { count: lowStockCount },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["scheduled", "in_progress"]),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .not("stock_qty", "is", null)
      .gt("stock_qty", 0)
      .lte("stock_qty", 5)
      .eq("is_active", true),
  ]);

  if (!authUser) {
    return (
      <AppSidebarClient
        {...props}
        user={fallbackUser}
        activeBookingsCount={activeBookingsCount ?? 0}
        lowStockCount={lowStockCount ?? 0}
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name,avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  const displayName = profile?.first_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : authUser.email ?? fallbackUser.name;

  return (
    <AppSidebarClient
      {...props}
      user={{
        name: displayName,
        email: authUser.email ?? fallbackUser.email,
        avatar: profile?.avatar_url ?? "",
      }}
      activeBookingsCount={activeBookingsCount ?? 0}
      lowStockCount={lowStockCount ?? 0}
    />
  );
}
