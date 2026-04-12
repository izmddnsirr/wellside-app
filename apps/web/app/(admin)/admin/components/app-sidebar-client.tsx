"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Bell,
  Calendar,
  FileText,
  Folder,
  History,
  Home,
  ListChecks,
  Clock,
  Package,
  Receipt,
  Settings,
  Scissors,
  Ticket,
  Users,
} from "lucide-react";

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
          icon: Home,
        },
        {
          title: "Queue",
          url: "/admin/queue",
          icon: ListChecks,
        },
        {
          title: "Bookings",
          icon: Folder,
          items: [
            {
              title: "Calendar",
              url: "/admin/bookings/calendar",
              icon: Calendar,
            },
            {
              title: "Active",
              url: "/admin/bookings/active",
              icon: ListChecks,
            },
            {
              title: "Past",
              url: "/admin/bookings/past",
              icon: History,
            },
          ],
        },
        {
          title: "POS",
          icon: Banknote,
          items: [
            {
              title: "Transactions",
              url: "/admin/pos/transactions",
              icon: Receipt,
            },
            {
              title: "Tickets",
              url: "/admin/pos/tickets",
              icon: Ticket,
            },
            {
              title: "Shifts",
              url: "/admin/pos/shifts",
              icon: Clock,
            },
          ],
        },
        {
          title: "Report",
          url: "/admin/report",
          icon: FileText, // TODO: verify icon match
        },
        {
          title: "Notifications",
          url: "/admin/notifications",
          icon: Bell,
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: Settings,
        },
      ],
    },
    {
      label: "Catalog",
      items: [
        {
          title: "Services",
          url: "/admin/services",
          icon: Scissors,
        },
        {
          title: "Products",
          url: "/admin/products",
          icon: Package,
        },
      ],
    },
    {
      label: "Users",
      items: [
        {
          title: "Customers",
          url: "/admin/customers",
          icon: Users,
        },
        {
          title: "Barbers",
          url: "/admin/barbers",
          icon: Scissors,
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
  activeBookingsCount?: number;
};

export function AppSidebarClient({
  user,
  activeBookingsCount = 0,
  ...props
}: AppSidebarClientProps) {
  const hasActiveBookings = activeBookingsCount > 0;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit"
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
        <NavMain
          groups={[
            {
              ...data.navMain[0],
              items: data.navMain[0].items.map((item) =>
                item.title === "Bookings"
                  ? {
                      ...item,
                      notification: hasActiveBookings,
                      notificationCount: activeBookingsCount,
                      items: item.items?.map((child) =>
                        child.title === "Active"
                          ? {
                              ...child,
                              notification: hasActiveBookings,
                              notificationCount: activeBookingsCount,
                            }
                          : child,
                      ),
                    }
                  : item
              ),
            },
            ...data.navMain.slice(1),
          ]}
        />
      </SidebarContent>
      <SidebarFooter className="rounded-2xl">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
