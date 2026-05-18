import { Suspense } from "react";
import { AdminShell } from "../components/admin-shell";
import { QueueDashboard } from "./queue-dashboard";
import { getQueueDashboardData } from "@/utils/queue";
import { getTodayQueueEntries } from "@/utils/queue-entries";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function QueueContent() {
  const [data, queueEntries] = await Promise.all([
    getQueueDashboardData(),
    getTodayQueueEntries(),
  ]);
  return <QueueDashboard data={data} queueEntries={queueEntries} />;
}

function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* TV Access card */}
      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-7 w-16 font-mono" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* 3-column queue grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            {/* Card header */}
            <div className="border-b border-border/60 px-5 py-4 space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-44" />
            </div>
            {/* Card items */}
            <div className="px-5 py-5 space-y-3">
              {Array.from({ length: col === 2 ? 2 : 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3.5 space-y-2.5">
                  {/* Top row: number + badge + status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-10 font-mono" />
                      <Skeleton className="h-px w-px" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {/* Customer info */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Queue">
      <Suspense fallback={<QueueSkeleton />}>
        <QueueContent />
      </Suspense>
    </AdminShell>
  );
}
