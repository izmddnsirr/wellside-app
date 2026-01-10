"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronDown, type Icon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import React from "react";

type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  items?: NavItem[];
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

  return (
    <>
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group.label ?? groupIndex}>
          <SidebarGroup>
            {group.label ? (
              <SidebarGroupLabel className="text-slate-500">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasChildren = Boolean(item.items?.length);
                  const isChildActive = item.items?.some((child) =>
                    pathname.startsWith(child.url ?? "")
                  );
                  const isActive = item.url
                    ? item.url === "/admin"
                      ? pathname === item.url
                      : pathname.startsWith(item.url)
                    : Boolean(isChildActive);
                  const isOpen =
                    openItems[item.title] ?? Boolean(isChildActive);

                  return (
                    <SidebarMenuItem key={item.title}>
                      {hasChildren ? (
                        <>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive}
                            className={cn(
                              "border border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 [&>svg]:text-slate-500 data-[active=true]:bg-slate-50 data-[active=true]:text-slate-900 data-[active=true]:border-slate-200 data-[active=true]:shadow-sm data-[active=true]:[&>svg]:text-slate-700"
                            )}
                            onClick={() =>
                              setOpenItems((prev) => ({
                                ...prev,
                                [item.title]: !isOpen,
                              }))
                            }
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <IconChevronDown
                              className={cn(
                                "ml-auto size-4 transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                          </SidebarMenuButton>
                          {isOpen ? (
                            <SidebarMenuSub>
                              {item.items?.map((child, childIndex) => (
                                <SidebarMenuSubItem
                                  key={child.title}
                                  className={cn(childIndex === 0 && "pt-1")}
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname.startsWith(
                                      child.url ?? ""
                                    )}
                                  >
                                    <Link href={child.url ?? "#"}>
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          ) : null}
                        </>
                      ) : (
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive}
                          className={cn(
                            "border border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 [&>svg]:text-slate-500 data-[active=true]:bg-slate-50 data-[active=true]:text-slate-900 data-[active=true]:border-slate-200 data-[active=true]:shadow-sm data-[active=true]:[&>svg]:text-slate-700"
                          )}
                          asChild
                        >
                          <Link href={item.url ?? "#"}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </React.Fragment>
      ))}
    </>
  );
}
