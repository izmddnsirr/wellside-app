import * as React from "react";
import { CustomerNav } from "@/components/customer/customer-nav";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-background font-semibold text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-30 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 opacity-70 blur-3xl lg:-top-24 lg:left-10 lg:h-96 lg:w-96 lg:translate-x-0" />
        <div className="absolute -right-24 top-40 h-56 w-56 rounded-full bg-secondary/20 opacity-80 blur-3xl lg:-right-10 lg:top-20 lg:h-80 lg:w-80" />
      </div>

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
