"use client";

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

const data = {
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
