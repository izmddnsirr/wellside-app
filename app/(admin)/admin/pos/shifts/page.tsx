import { AdminShell } from "../../components/admin-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Page() {
  const shiftHistory = [
    {
      id: "SHIFT-2024-09-12",
      openedAt: "9:00 AM",
      closedAt: "6:00 PM",
      tickets: 18,
      total: "RM 1,420",
      status: "Closed",
    },
    {
      id: "SHIFT-2024-09-11",
      openedAt: "9:30 AM",
      closedAt: "5:45 PM",
      tickets: 14,
      total: "RM 1,050",
      status: "Closed",
    },
    {
      id: "SHIFT-2024-09-10",
      openedAt: "10:00 AM",
      closedAt: "6:30 PM",
      tickets: 22,
      total: "RM 1,780",
      status: "Closed",
    },
  ];

  return (
    <AdminShell title="POS" description="Shift history.">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Shift history</CardTitle>
            <CardDescription>Past shifts and totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftHistory.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.id}</TableCell>
                    <TableCell>{shift.openedAt}</TableCell>
                    <TableCell>{shift.closedAt}</TableCell>
                    <TableCell>{shift.tickets}</TableCell>
                    <TableCell>{shift.total}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-900 border-emerald-200"
                      >
                        {shift.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
