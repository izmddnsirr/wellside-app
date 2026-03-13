import type { ComponentProps } from "react";

import { createAdminClient } from "@/utils/supabase/server";
import { AppSidebarClient } from "./app-sidebar-client";
import type { Sidebar } from "@/components/ui/sidebar";

const fallbackUser = {
  name: "Admin",
  email: "wellside.inc@gmail.com",
  avatar: "/avatars/shadcn.jpg",
};

type SidebarProps = ComponentProps<typeof Sidebar>;

export async function AppSidebar(props: SidebarProps) {
  const supabase = await createAdminClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { count: activeBookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ["scheduled", "in_progress"]);

  if (!authUser) {
    return (
      <AppSidebarClient
        {...props}
        user={fallbackUser}
        activeBookingsCount={activeBookingsCount ?? 0}
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name,last_name")
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
        avatar: fallbackUser.avatar,
      }}
      activeBookingsCount={activeBookingsCount ?? 0}
    />
  );
}
