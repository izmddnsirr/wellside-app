import { AdminShell } from "../components/admin-shell";
import { NotificationsClient } from "./notifications-client";

export const metadata = {
  title: "Notifications — Wellside+",
};

export default function Page() {
  return (
    <AdminShell title="Notifications">
      <NotificationsClient />
    </AdminShell>
  );
}
