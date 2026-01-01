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
  const { data: barbers, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("role", "barber")
    .order("created_at", { ascending: false });

  return (
    <AdminShell
      title="Barbers"
      description="Manage staff schedules and performance."
    >
      <div className="px-4 lg:px-6">
        {error ? (
          <p className="text-sm text-red-600">
            Failed to load barbers. Please try again.
          </p>
        ) : barbers && barbers.length > 0 ? (
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
                {barbers.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="font-medium">
                      {[barber.first_name, barber.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell>{barber.email || "-"}</TableCell>
                    <TableCell>{barber.phone || "-"}</TableCell>
                    <TableCell>{formatDate(barber.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No barbers found yet.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
