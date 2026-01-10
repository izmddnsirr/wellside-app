"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconDashboard,
  IconFolder,
} from "@tabler/icons-react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createBarberClient } from "@/utils/supabase/client";

const data = {
  user: {
    name: "Staff",
    email: "staff@wellside.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/barber",
          icon: IconDashboard,
        },
        {
          title: "Bookings",
          url: "/barber/bookings",
          icon: IconFolder,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(data.user);

  React.useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const supabase = createBarberClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .eq("id", authUser.id)
        .maybeSingle();

      const displayName = profile?.first_name
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
        : authUser.email ?? data.user.name;

      if (isMounted) {
        setUser({
          name: displayName,
          email: authUser.email ?? data.user.email,
          avatar: "",
        });
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/barber">
                <Image
                  src="/wellside-logo.png"
                  alt="Wellside"
                  width={120}
                  height={32}
                  className="h-6 w-auto"
                  priority
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border rounded-2xl bg-white">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
