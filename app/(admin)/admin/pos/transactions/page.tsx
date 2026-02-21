import { AdminShell } from "../../components/admin-shell";
import { TransactionsClient } from "./transactions-client";

export default function Page() {
  return (
    <AdminShell title="Transactions">
      <TransactionsClient />
    </AdminShell>
  );
}
