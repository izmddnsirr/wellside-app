import { AdminShell } from "../components/admin-shell";
import { QueueDashboard } from "./queue-dashboard";
import { getQueueDashboardData } from "@/utils/queue";
import { getTodayQueueEntries } from "@/utils/queue-entries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [data, queueEntries] = await Promise.all([
    getQueueDashboardData(),
    getTodayQueueEntries(),
  ]);

  return (
    <AdminShell title="Queue">
      <QueueDashboard data={data} queueEntries={queueEntries} />
    </AdminShell>
  );
}
