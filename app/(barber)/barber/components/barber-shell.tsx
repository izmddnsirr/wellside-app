import * as React from "react";
import { cookies } from "next/headers";

import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type BarberShellProps = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export async function BarberShell({
  title,
  description,
  children,
}: BarberShellProps) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get?.("sidebar_state")?.value;
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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {title || description ? (
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-1">
                    {title ? (
                      <h2 className="text-xl font-semibold">{title}</h2>
                    ) : null}
                    {description ? (
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
