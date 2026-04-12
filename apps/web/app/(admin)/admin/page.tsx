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
      <div className="grid gap-4 px-5 lg:px-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-13 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="px-4 lg:px-6 space-y-3 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
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
