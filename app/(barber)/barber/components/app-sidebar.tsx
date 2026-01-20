import type { ComponentProps } from "react";

import { createBarberClient } from "@/utils/supabase/server";
import { AppSidebarClient } from "./app-sidebar-client";
import type { Sidebar } from "@/components/ui/sidebar";

const fallbackUser = {
  name: "Staff",
  email: "staff@wellside.com",
  avatar: "/avatars/shadcn.jpg",
};

type SidebarProps = ComponentProps<typeof Sidebar>;

export async function AppSidebar(props: SidebarProps) {
  const supabase = await createBarberClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return <AppSidebarClient {...props} user={fallbackUser} />;
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
    />
  );
}
