import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "./components/admin-shell";
import { DashboardContent } from "./dashboard-content";
import { Metadata } from "next";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Wellside+",
  description: "Wellside Barbershop booking and management system.",
};

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-border/60 bg-card p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border border-border/60 bg-card pt-0">
          <div className="mx-0 flex flex-col gap-3 border-b border-border/60 px-6 py-6 sm:flex-row sm:items-center">
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Skeleton className="h-9 w-full sm:w-45" />
              <Skeleton className="h-9 w-full sm:w-40" />
              <div className="hidden h-12 w-px bg-border/60 sm:block" />
              <div className="hidden space-y-2 sm:block">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-28" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-62.5 w-full rounded-lg" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-border/60 bg-card p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AdminShell title="Dashboard">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </AdminShell>
  );
}
