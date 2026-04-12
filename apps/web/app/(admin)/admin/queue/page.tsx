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
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
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
