import { AdminShell } from "../components/admin-shell";
import { createClient } from "@/utils/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function Page() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <AdminShell
      title="Customers"
      description="Track customer profiles and engagement."
    >
      <div className="px-4 lg:px-6">
        {error ? (
          <p className="text-sm text-red-600">
            Failed to load customers. Please try again.
          </p>
        ) : customers && customers.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {[customer.first_name, customer.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No customers found yet.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
