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
  const ticketHistory = [
    {
      id: "T-001",
      items: "Haircut",
      total: "RM 45",
      method: "Cash",
      status: "Completed",
      shift: "SHIFT-2024-09-12",
      time: "10:05 AM",
    },
    {
      id: "T-002",
      items: "Haircut, Shave, Pomade",
      total: "RM 100",
      method: "E-wallet",
      status: "Completed",
      shift: "SHIFT-2024-09-12",
      time: "1:22 PM",
    },
    {
      id: "T-003",
      items: "Pomade",
      total: "RM 35",
      method: "Cash",
      status: "Completed",
      shift: "SHIFT-2024-09-11",
      time: "6:18 PM",
    },
  ];

  return (
    <AdminShell title="POS" description="Ticket history.">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket history</CardTitle>
            <CardDescription>All recorded tickets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketHistory.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.id}</TableCell>
                    <TableCell>{ticket.shift}</TableCell>
                    <TableCell>{ticket.items}</TableCell>
                    <TableCell>{ticket.method}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-900 border-emerald-200"
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{ticket.total}</TableCell>
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
