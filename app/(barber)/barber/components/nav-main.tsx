"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.label ?? groupIndex}>
          {group.label ? (
            <SidebarGroupLabel className="text-slate-500">
              {group.label}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className={cn(
                      "border border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 [&>svg]:text-slate-500 data-[active=true]:bg-slate-50 data-[active=true]:text-slate-900 data-[active=true]:border-slate-200 data-[active=true]:[&>svg]:text-slate-700"
                    )}
                    tooltip={item.title}
                    isActive={
                      item.url === "/barber"
                        ? pathname === item.url
                        : pathname.startsWith(item.url)
                    }
                    asChild
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
