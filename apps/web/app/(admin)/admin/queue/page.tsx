import { AdminShell } from "../components/admin-shell";
import { QueueDashboard } from "./queue-dashboard";
import { getQueueDashboardData } from "@/utils/queue";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getQueueDashboardData();

  return (
    <AdminShell title="Queue">
      <QueueDashboard data={data} />
    </AdminShell>
  );
}
