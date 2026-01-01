"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconCashBanknote,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconScissors,
  IconUsers,
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
    name: "Admin",
    email: "wellside.inc@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: IconDashboard,
        },
        {
          title: "Bookings",
          url: "/admin/bookings",
          icon: IconFolder,
        },
      ],
    },
    {
      label: "Catalog",
      items: [
        {
          title: "Services",
          url: "/admin/services",
          icon: IconChartBar,
        },
        {
          title: "Products",
          url: "/admin/products",
          icon: IconListDetails,
        },
      ],
    },
    {
      label: "Users",
      items: [
        {
          title: "Customers",
          url: "/admin/customers",
          icon: IconUsers,
        },
        {
          title: "Barbers",
          url: "/admin/barbers",
          icon: IconScissors,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "POS",
          url: "/admin/pos",
          icon: IconCashBanknote,
        },
        {
          title: "Report",
          url: "/admin/report",
          icon: IconReport,
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
              <Link href="/admin">
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
      <SidebarFooter className="border rounded-2xl bg-white shadow">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
