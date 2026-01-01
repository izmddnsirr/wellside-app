"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
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
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Wellside Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border rounded-2xl bg-white">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
