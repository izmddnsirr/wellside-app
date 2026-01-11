"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type TicketItem = {
  qty: number | null;
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
  shifts: { shift_code: string | null; label: string | null } | null;
  ticket_items: TicketItem[] | null;
};

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getStatusTone = (status: string) => {
  if (status === "paid") {
    return {
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (status === "refunded") {
    return {
      badge: "bg-rose-100 text-rose-900 border-rose-200",
      dot: "bg-rose-500",
    };
  }
  return {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  };
};

const toTitleCase = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getItemsLabel = (items: TicketItem[] | null) =>
  items
    ?.map((item) => {
      const name = item.services?.name || item.products?.name || "Item";
      return `${name} x${item.qty ?? 0}`;
    })
    .join(", ") || "-";

export const TicketsTable = ({ tickets }: { tickets: TicketRow[] }) => {
  const [query, setQuery] = useState("");
  const filteredTickets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return tickets;
    }
    return tickets.filter((ticket) => {
      const shiftLabel =
        ticket.shifts?.shift_code || ticket.shifts?.label || "-";
      const itemsLabel = getItemsLabel(ticket.ticket_items);
      return [
        ticket.ticket_no,
        ticket.id,
        ticket.payment_status,
        ticket.payment_method,
        shiftLabel,
        itemsLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(trimmed);
    });
  }, [query, tickets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Ticket history</h3>
          <p className="text-xs text-muted-foreground">All recorded tickets.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="ticket-search"
            placeholder="Search tickets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-9"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ticket
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Shift
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => {
              const shiftLabel =
                ticket.shifts?.shift_code || ticket.shifts?.label || "-";
              const status = ticket.payment_status ?? "unpaid";
              const isPaid = status === "paid";
              const tone = getStatusTone(status);
              return (
                <TableRow
                  key={ticket.id}
                  className="border-border/60 bg-white hover:bg-slate-50/70"
                >
                  <TableCell className="px-4 py-3 font-semibold text-slate-900">
                    {ticket.ticket_no ?? ticket.id}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600">
                    {shiftLabel}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                      <span className={`size-2 rounded-full ${tone.dot}`} />
                      {toTitleCase(status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-semibold text-slate-900">
                    {formatMoney(ticket.total_amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="p-0">
                        <SheetHeader className="border-b">
                          <SheetTitle>
                            {ticket.ticket_no ?? ticket.id}
                          </SheetTitle>
                          <SheetDescription>Ticket details</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-4 px-4 pb-6 pt-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Status
                            </p>
                            <Badge
                              variant="outline"
                              className={`gap-2 ${tone.badge}`}
                            >
                              <span
                                className={`size-2 rounded-full ${tone.dot}`}
                              />
                              {toTitleCase(status)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Shift</p>
                            <p>{shiftLabel}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p>{getItemsLabel(ticket.ticket_items)}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Method
                              </p>
                              <p>
                                {isPaid ? toTitleCase(ticket.payment_method) : "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Paid at
                              </p>
                              <p>{isPaid ? formatDateTime(ticket.paid_at) : "-"}</p>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Created at
                              </p>
                              <p>{formatDateTime(ticket.created_at)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-semibold">
                                {formatMoney(ticket.total_amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
