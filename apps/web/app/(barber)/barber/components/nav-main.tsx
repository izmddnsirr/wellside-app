"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, type LucideIcon } from "lucide-react";
import React from "react";
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

type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
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
              <SidebarGroupLabel className="text-muted-foreground">
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
                    ? item.url === "/barber"
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
                              "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground [&>svg]:text-muted-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:border-border data-[active=true]:[&>svg]:text-foreground"
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
                            <ChevronDown
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
                                      {child.icon ? <child.icon /> : null}
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
                            "border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground [&>svg]:text-muted-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:border-border data-[active=true]:[&>svg]:text-foreground"
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
