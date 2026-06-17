"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  CreditCard,
  Eye,
  Ticket,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

type TicketItem = {
  qty: number | null;
  unit_price?: number | null;
  services: { name: string | null } | null;
  products: { name: string | null } | null;
};

type TicketRow = {
  id: string;
  ticket_no: string | null;
  payment_status: string | null;
  payment_method: string | null;
  total_amount: number | null;
  paid_at: string | null;
  created_at: string | null;
  ticket_items: TicketItem[];
};

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(value);
};

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatTime = (value: string | null) => {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
};

const statusBadge = (status: string | null) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Paid</Badge>;
    case "unpaid":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Unpaid</Badge>;
    case "refunded":
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">Refunded</Badge>;
    default:
      return <Badge variant="secondary">{status ?? "Unknown"}</Badge>;
  }
};

const getSaleType = (items: TicketItem[]) => {
  const hasService = items.some((i) => i.services?.name);
  const hasProduct = items.some((i) => i.products?.name);
  if (hasService && hasProduct) return "Service & Product";
  if (hasProduct) return "Product";
  return "Service";
};

type BarberTicketsClientProps = {
  tickets: TicketRow[];
  totalEarnings: number;
  cashEarnings: number;
  ewalletEarnings: number;
};

export function BarberTicketsClient({
  tickets,
  totalEarnings,
  cashEarnings,
  ewalletEarnings,
}: BarberTicketsClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.payment_status === statusFilter);
  }, [tickets, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Total earnings
            </CardDescription>
            <CardTitle className="text-2xl">{formatMoney(totalEarnings)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Banknote className="h-3.5 w-3.5" />
              Cash
            </CardDescription>
            <CardTitle className="text-2xl">{formatMoney(cashEarnings)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              E-wallet
            </CardDescription>
            <CardTitle className="text-2xl">{formatMoney(ewalletEarnings)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="bg-background hover:bg-muted/50"
                >
                  <TableCell className="text-muted-foreground">
                    {formatDate(ticket.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatTime(ticket.created_at)}
                  </TableCell>
                  <TableCell>{getSaleType(ticket.ticket_items)}</TableCell>
                  <TableCell>{statusBadge(ticket.payment_status)}</TableCell>
                  <TableCell className="capitalize">
                    {ticket.payment_method === "ewallet"
                      ? "E-wallet"
                      : ticket.payment_method ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(ticket.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>
                            Ticket {ticket.ticket_no ?? ticket.id.slice(0, 8)}
                          </SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Status
                            </span>
                            {statusBadge(ticket.payment_status)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Payment
                            </span>
                            <span className="text-sm capitalize">
                              {ticket.payment_method === "ewallet"
                                ? "E-wallet"
                                : ticket.payment_method ?? "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Date
                            </span>
                            <span className="text-sm">
                              {formatDate(ticket.created_at)}{" "}
                              {formatTime(ticket.created_at)}
                            </span>
                          </div>
                          <div className="border-t pt-4">
                            <p className="text-sm font-semibold mb-2">Items</p>
                            {ticket.ticket_items.map((item, i) => {
                              const name =
                                item.services?.name ??
                                item.products?.name ??
                                "Item";
                              const price = item.unit_price ?? 0;
                              const qty = item.qty ?? 1;
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1 text-sm"
                                >
                                  <span>
                                    {name}
                                    {qty > 1 ? ` × ${qty}` : ""}
                                  </span>
                                  <span>{formatMoney(price * qty)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t pt-4 flex items-center justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatMoney(ticket.total_amount)}</span>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
            <Ticket className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">No tickets found</p>
            <p className="text-sm text-muted-foreground">
              Tickets will appear here once created.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
