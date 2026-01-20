"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ChevronLeft, ChevronRight, Search, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import { deleteTicket } from "./actions";

type TicketItem = {
  qty: number | null;
  unit_price?: number | null;
  services: { name: string | null; base_price: number | null } | null;
  products: { name: string | null; base_price: number | null } | null;
};

export type TicketRow = {
  id: string;
  ticket_no: string | null;
  payment_status: string | null;
  payment_method: string | null;
  total_amount: number | null;
  cash_received: number | null;
  change_due: number | null;
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

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kuala_Lumpur",
});

const formatDate = (value: Date) => {
  const parts = dateFormatter.formatToParts(value);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return [day, month, year].filter(Boolean).join(" ");
};

const formatTime = (value: Date) => {
  const parts = timeFormatter.formatToParts(value);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod =
    parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const periodSuffix = dayPeriod ? ` ${dayPeriod.toUpperCase()}` : "";
  return `${hour}:${minute}${periodSuffix}`.trim();
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return `${formatDate(date)}, ${formatTime(date)}`.trim();
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

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const parseDateInput = (value: string) => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from) {
    return "Select a date range";
  }
  const formatter = new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  });
  const fromLabel = formatter.format(range.from);
  if (!range.to) {
    return `${fromLabel} →`;
  }
  return `${fromLabel} → ${formatter.format(range.to)}`;
};

const formatMonthValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (value: string) => {
  if (!value) {
    return "Pick month";
  }
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return "Pick month";
  }
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const TicketsTable = ({ tickets }: { tickets: TicketRow[] }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    date: "all",
    dateFrom: "",
    dateTo: "",
    month: "",
  });
  const [sort, setSort] = useState("created_desc");
  const [range, setRange] = useState<DateRange | undefined>();
  const [monthPickerYear, setMonthPickerYear] = useState(
    filters.month ? Number(filters.month.split("-")[0]) : new Date().getFullYear()
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteError(null);
      setDeleteTarget(null);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    const result = await deleteTicket(deleteTarget.id);
    if (!result?.ok) {
      setDeleteError(result?.error ?? "Failed to delete ticket.");
      setDeleteLoading(false);
      return;
    }
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    router.refresh();
  };

  useEffect(() => {
    if (filters.date !== "month" || filters.month) {
      return;
    }
    const now = new Date();
    const currentMonth = formatMonthValue(now);
    setFilters((prev) => ({ ...prev, month: currentMonth }));
    setMonthPickerYear(now.getFullYear());
  }, [filters.date, filters.month]);

  const hasVoidStatus = useMemo(
    () =>
      tickets.some(
        (ticket) => ticket.payment_status?.toLowerCase() === "void"
      ),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    const customStart = parseDateInput(filters.dateFrom);
    const customEnd = parseDateInput(filters.dateTo);
    const isCustomRangeValid =
      customStart && customEnd && customStart <= customEnd;
    const monthParts = filters.month.split("-");
    const monthYear = Number(monthParts[0]);
    const monthValue = Number(monthParts[1]);
    const isMonthValid = monthYear && monthValue;
    const monthStart = isMonthValid
      ? startOfDay(new Date(monthYear, monthValue - 1, 1))
      : null;
    const monthEnd = isMonthValid
      ? endOfDay(new Date(monthYear, monthValue, 0))
      : null;

    const matchesSearch = (ticket: TicketRow) => {
      if (!debouncedSearch) {
        return true;
      }
      const shiftLabel =
        ticket.shifts?.shift_code || ticket.shifts?.label || "-";
      return [ticket.ticket_no, ticket.id, shiftLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(debouncedSearch);
    };

    const matchesStatus = (ticket: TicketRow) => {
      if (filters.status === "all") {
        return true;
      }
      const status = (ticket.payment_status ?? "unpaid").toLowerCase();
      return status === filters.status;
    };

    const matchesDate = (ticket: TicketRow) => {
      if (!ticket.created_at) {
        return filters.date === "all";
      }
      const createdAt = new Date(ticket.created_at);
      if (filters.date === "all") {
        return true;
      }
      if (filters.date === "month" && monthStart && monthEnd) {
        return createdAt >= monthStart && createdAt <= monthEnd;
      }
      if (filters.date === "custom" && isCustomRangeValid) {
        return (
          createdAt >= startOfDay(customStart) &&
          createdAt <= endOfDay(customEnd)
        );
      }
      return true;
    };

    const filtered = tickets.filter(
      (ticket) =>
        matchesSearch(ticket) && matchesStatus(ticket) && matchesDate(ticket)
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      const aTotal = a.total_amount ?? 0;
      const bTotal = b.total_amount ?? 0;
      if (sort === "created_desc") {
        return bCreated - aCreated;
      }
      if (sort === "created_asc") {
        return aCreated - bCreated;
      }
      if (sort === "total_desc") {
        return bTotal - aTotal;
      }
      if (sort === "total_asc") {
        return aTotal - bTotal;
      }
      return 0;
    });

    return sorted;
  }, [debouncedSearch, filters, sort, tickets]);

  const resetFilters = () => {
    setFilters({
      status: "all",
      date: "all",
      dateFrom: "",
      dateTo: "",
      month: "",
    });
    setSort("created_desc");
    setSearchInput("");
    setRange(undefined);
    setMonthPickerYear(new Date().getFullYear());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              {hasVoidStatus ? <SelectItem value="void">Void</SelectItem> : null}
            </SelectContent>
          </Select>
          <Select
            value={filters.date}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, date: value }))
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Date scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="custom">Date range</SelectItem>
            </SelectContent>
          </Select>
          {filters.date === "month" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 min-w-[120px] justify-between"
                  >
                    {formatMonthLabel(filters.month)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-3" align="start">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMonthPickerYear((prev) => prev - 1)}
                      aria-label="Previous year"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="text-sm font-semibold">
                      {monthPickerYear}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMonthPickerYear((prev) => prev + 1)}
                      aria-label="Next year"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {MONTH_LABELS.map((label, index) => {
                      const value = `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`;
                      const isActive = filters.month === value;
                      return (
                        <Button
                          key={label}
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              month: value,
                            }))
                          }
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    month: "",
                  }))
                }
                disabled={!filters.month}
              >
                Clear
              </Button>
            </div>
          ) : null}
          {filters.date === "custom" ? (
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 min-w-[140px] justify-between text-left"
                  >
                    {range?.from ? formatRangeLabel(range) : "Pick date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2" align="start">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={range}
                    onSelect={(value) => {
                      setRange(value);
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: value?.from ? formatDateInput(value.from) : "",
                        dateTo: value?.to ? formatDateInput(value.to) : "",
                      }));
                    }}
                    captionLayout="dropdown"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => {
                  setRange(undefined);
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: "",
                    dateTo: "",
                  }));
                }}
                disabled={!range?.from}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">
                Created date: Newest → Oldest
              </SelectItem>
              <SelectItem value="created_asc">
                Created date: Oldest → Newest
              </SelectItem>
              <SelectItem value="total_desc">
                Total: High → Low
              </SelectItem>
              <SelectItem value="total_asc">
                Total: Low → High
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="ticket-search"
              placeholder="Search tickets"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>
      {filters.date === "month" && filters.month ? (
        <p className="text-xs text-muted-foreground">
          Showing tickets for {formatMonthLabel(filters.month)}
        </p>
      ) : null}
      {filteredTickets.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
            <Ticket className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No tickets match your search"
                : "No tickets found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different ticket number or shift."
                : "Tickets will appear here once sales are recorded."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </TableHead>
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
                const paymentMethod = (ticket.payment_method ?? "").toLowerCase();
                const isCash = paymentMethod === "cash";
                const totalAmount =
                  typeof ticket.total_amount === "number"
                    ? ticket.total_amount
                    : null;
                const storedCashReceived =
                  typeof ticket.cash_received === "number"
                    ? ticket.cash_received
                    : null;
                const storedChangeDue =
                  typeof ticket.change_due === "number" ? ticket.change_due : null;
                const cashReceived =
                  isPaid && isCash ? storedCashReceived ?? totalAmount : null;
                const balanceAmount = isPaid
                  ? storedChangeDue ??
                    (isCash && cashReceived !== null && totalAmount !== null
                      ? cashReceived - totalAmount
                      : totalAmount !== null
                      ? 0
                      : null)
                  : null;
                const tone = getStatusTone(status);
                const itemLines =
                  ticket.ticket_items?.map((item, index) => {
                    const detail = item.services ?? item.products;
                    const name = detail?.name || "Item";
                    const price =
                      typeof item.unit_price === "number"
                        ? item.unit_price
                        : typeof detail?.price === "number"
                          ? detail.price
                          : null;
                    const qty = item.qty ?? 0;
                    const lineTotal = price !== null ? price * qty : null;
                    return {
                      key: `${name}-${index}`,
                      label: name,
                      qty,
                      price,
                      lineTotal,
                    };
                  }) ?? [];
                return (
                  <TableRow
                    key={ticket.id}
                    className="border-border/60 bg-background hover:bg-muted/50"
                  >
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(ticket.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-foreground">
                      {ticket.ticket_no ?? ticket.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {shiftLabel}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {toTitleCase(status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-foreground">
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
                          <div className="flex h-full flex-col bg-muted/10">
                            <SheetHeader className="border-b bg-background px-6 py-4 pr-12">
                              <SheetTitle className="text-base font-semibold text-foreground">
                                {ticket.ticket_no ?? ticket.id}
                              </SheetTitle>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="h-6 gap-2 border-border bg-muted/50 px-2 text-[11px] text-muted-foreground"
                                >
                                  {shiftLabel}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`h-6 gap-2 px-2 text-[11px] ${tone.badge}`}
                                >
                                  <span className={`size-2 rounded-full ${tone.dot}`} />
                                  {toTitleCase(status)}
                                </Badge>
                              </div>
                            </SheetHeader>
                            <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
                              <div className="rounded-2xl border border-border bg-background">
                                <div className="px-4 py-4">
                                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    <span>Items</span>
                                    <span>Amount</span>
                                  </div>
                                  {itemLines.length > 0 ? (
                                    <ul className="mt-3 divide-y divide-dashed divide-border">
                                      {itemLines.map((item) => (
                                        <li
                                          key={item.key}
                                          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                          <div className="min-w-0 space-y-1">
                                            <p className="font-medium text-foreground">
                                              {item.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              x{item.qty} ·{" "}
                                              {item.price !== null
                                                ? formatMoney(item.price)
                                                : "-"}
                                            </p>
                                          </div>
                                          <p className="text-sm font-semibold text-foreground">
                                            {item.lineTotal !== null
                                              ? formatMoney(item.lineTotal)
                                              : "-"}
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-3 text-sm font-medium text-foreground">
                                      -
                                    </p>
                                  )}
                                </div>
                                <div className="border-t border-dashed border-border px-4 py-4">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span>Subtotal</span>
                                      <span>{formatMoney(totalAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-base font-semibold text-foreground">
                                      <span>Total</span>
                                      <span>{formatMoney(totalAmount)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t border-dashed border-border px-4 py-4">
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Method
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {isPaid
                                          ? toTitleCase(ticket.payment_method)
                                          : "-"}
                                      </span>
                                    </div>
                                    {isPaid && isCash ? (
                                      <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                          Cash received
                                        </span>
                                        <span className="font-medium text-foreground">
                                          {formatMoney(cashReceived)}
                                        </span>
                                      </div>
                                    ) : null}
                                    {isPaid ? (
                                      <div className="flex items-center justify-between font-semibold text-foreground">
                                        <span>Balance</span>
                                        <span>{formatMoney(balanceAmount)}</span>
                                      </div>
                                    ) : null}
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground">
                                        Paid at
                                      </p>
                                      <p className="font-medium text-foreground">
                                        {isPaid
                                          ? formatDateTime(ticket.paid_at)
                                          : "-"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t border-dashed border-border px-4 py-3">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Ticket ID
                                  </p>
                                  <p className="mt-1 break-all text-xs font-medium text-foreground">
                                    {ticket.id}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: ticket.id,
                                      label: ticket.ticket_no ?? ticket.id,
                                    });
                                    setDeleteDialogOpen(true);
                                    setDeleteError(null);
                                  }}
                                  disabled={deleteLoading}
                                >
                                  Delete ticket
                                </Button>
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
      )}
      {isMounted ? (
        <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete ticket</DialogTitle>
              <DialogDescription>
                This will delete the ticket and all related items. This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Ticket:{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget?.label ?? "-"}
                </span>
              </p>
              {deleteError ? (
                <p className="text-sm text-red-600">{deleteError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => handleDeleteDialogOpenChange(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTicket}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
};
