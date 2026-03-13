"use client";

import Image from "next/image";
import Link from "next/link";
import { Folder, History, Home, ListChecks } from "lucide-react";
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
          url: "/barber",
          icon: Home,
        },
        {
          title: "Bookings",
          icon: Folder,
          items: [
            {
              title: "Active",
              url: "/barber/bookings/active",
              icon: ListChecks,
            },
            {
              title: "Past",
              url: "/barber/bookings/past",
              icon: History,
            },
          ],
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
              <Link href="/barber">
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
      <SidebarFooter className="">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
