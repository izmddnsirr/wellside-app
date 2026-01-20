import { SiteHeader } from "./site-header";
import * as React from "react";

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
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {title || description ? (
              <div className="px-4 lg:px-6">
                <div className="flex flex-col gap-1">
                  {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
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
    </>
  );
}
