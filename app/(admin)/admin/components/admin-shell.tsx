import * as React from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AdminShellProps = {
  title?: string;
  description?: string;
  headerMeta?: React.ReactNode;
  children?: React.ReactNode;
};

export async function AdminShell({
  title,
  description,
  headerMeta,
  children,
}: AdminShellProps) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie ? sidebarCookie === "true" : true;

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="bg-background"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} meta={headerMeta} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 [&_[data-slot=card]]:shadow-none">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
