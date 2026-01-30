import { AdminShell } from "../../components/admin-shell";
import { TransactionsClient } from "./transactions-client";
import { ShiftHeader } from "./shift-header";

export default function Page() {
  return (
    <AdminShell title="Transactions">
      <TransactionsClient />
    </AdminShell>
  );
}
