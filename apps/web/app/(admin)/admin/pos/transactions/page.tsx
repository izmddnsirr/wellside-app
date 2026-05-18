import { Suspense } from "react";
import { AdminShell } from "../../components/admin-shell";
import { TransactionsClient } from "./transactions-client";
import { Skeleton } from "@/components/ui/skeleton";

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="space-y-5">
        {/* Shift header row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-70 hidden sm:block" />
          </div>
        </div>

        {/* Two-column: catalog + cart */}
        <div className="grid gap-5 md:grid-cols-[1.4fr_0.9fr]">
          {/* Catalog card */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-4">
              {/* Services section */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <div className="grid gap-4 grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-18 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              {/* Products section */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <div className="grid gap-4 grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-18 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cart card */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            {/* Empty cart placeholder */}
            <Skeleton className="h-24 w-full rounded-2xl" />
            {/* Separator */}
            <Skeleton className="h-px w-full" />
            {/* Subtotal/Total */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            {/* Checkout details */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Transactions">
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsClient />
      </Suspense>
    </AdminShell>
  );
}
