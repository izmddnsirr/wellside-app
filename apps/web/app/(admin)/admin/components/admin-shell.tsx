import { SiteHeader } from "./site-header";
import * as React from "react";

type AdminShellProps = {
  title?: React.ReactNode;
  headerMeta?: React.ReactNode;
  children?: React.ReactNode;
};

export async function AdminShell({
  title,
  headerMeta,
  children,
}: AdminShellProps) {
  return (
    <>
      <SiteHeader title={title} meta={headerMeta} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2 **:data-[slot=card]:shadow-none">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
