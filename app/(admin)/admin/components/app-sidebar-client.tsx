"use client";

import Image from "next/image";
import Link from "next/link";
import {
  IconCashBanknote,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconCalendarEvent,
  IconListDetails,
  IconReport,
  IconScissors,
  IconTicket,
  IconTimeline,
  IconReceipt,
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
          icon: IconFolder,
          items: [
            {
              title: "Calendar",
              url: "/admin/bookings/calendar",
              icon: IconCalendarEvent,
            },
            {
              title: "Active",
              url: "/admin/bookings/active",
              icon: IconListDetails,
            },
            {
              title: "Past",
              url: "/admin/bookings/past",
              icon: IconTimeline,
            },
          ],
        },
        {
          title: "POS",
          icon: IconCashBanknote,
          items: [
            {
              title: "Transactions",
              url: "/admin/pos/transactions",
              icon: IconReceipt,
            },
            {
              title: "Tickets",
              url: "/admin/pos/tickets",
              icon: IconTicket,
            },
            {
              title: "Shifts",
              url: "/admin/pos/shifts",
              icon: IconTimeline,
            },
          ],
        },
        {
          title: "Report",
          url: "/admin/report",
          icon: IconReport,
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
  ],
};

type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

type AppSidebarClientProps = React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser;
};

export function AppSidebarClient({ user, ...props }: AppSidebarClientProps) {
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
                {/* <IconInnerShadowTop className="size-5!" /> */}
                <Image
                  src="/wellside-logo.png"
                  alt="Wellside"
                  width={120}
                  height={32}
                  className="h-6 w-auto dark:hidden"
                  priority
                />
                <Image
                  src="/wellside-logo-white.png"
                  alt="Wellside"
                  width={120}
                  height={32}
                  className="hidden h-6 w-auto dark:block"
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
      <SidebarFooter className="rounded-2xl">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
