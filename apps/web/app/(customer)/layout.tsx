import * as React from "react";
import { CustomerNav } from "@/components/customer/customer-nav";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-background font-semibold text-foreground">
      <header className="lg:sticky lg:top-0 lg:z-30 lg:pt-4">
        <div className="mx-auto w-full max-w-none px-5 lg:px-10">
          <CustomerNav />
        </div>
      </header>

      <main className="relative mx-auto flex min-h-screen w-full max-w-none flex-col gap-6 px-4 pb-16 pt-4 text-[0.9rem] leading-[1.45] lg:gap-7 lg:px-8 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
