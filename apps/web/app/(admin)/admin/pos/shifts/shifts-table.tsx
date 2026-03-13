"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight, Clock, Pencil, Search } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteShift } from "./actions";

type ShiftSummary = {
  id: string;
  shift_code: string | null;
  label: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

type ShiftItemSummary = {
  key: string;
  label: string;
  type: "service" | "product";
  qty: number;
  total: number;
};

type ShiftsTableProps = {
  shifts: ShiftSummary[];
  salesByShift: Record<string, number>;
  cashSalesByShift: Record<string, number>;
  ewalletSalesByShift: Record<string, number>;
  refundedSalesByShift: Record<string, number>;
  ticketsCountByShift: Record<string, number>;
  itemsByShift: Record<string, ShiftItemSummary[]>;
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

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

const normalizeStatus = (status: string | null) => status?.toLowerCase() ?? "";

const isOpenStatus = (status: string | null, endAt: string | null) => {
  if (!endAt) {
    return true;
  }
  const normalized = normalizeStatus(status);
  return normalized === "open" || normalized === "active";
};

const isClosedStatus = (status: string | null, endAt: string | null) => {
  if (!endAt) {
    return false;
  }
  const normalized = normalizeStatus(status);
  return normalized === "closed" || normalized === "inactive" || Boolean(endAt);
};

const getStatusTone = (status: string | null, endAt: string | null) => {
  if (isOpenStatus(status, endAt)) {
    return {
      badge:
        "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
    };
  }
  if (isClosedStatus(status, endAt)) {
    return {
      badge:
        "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
    };
  }
  return {
    badge:
      "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  };
};

const formatStatusLabel = (status: string | null, endAt: string | null) => {
  if (isOpenStatus(status, endAt)) {
    return "Open";
  }
  if (isClosedStatus(status, endAt)) {
    return "Closed";
  }
  return status ?? "Unknown";
};

const joinName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ") || "Unknown";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

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

const getMonthKey = (value: string | null) => {
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthGroupLabel = (value: string | null) => {
  if (!value) {
    return "UNKNOWN MONTH";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "UNKNOWN MONTH";
  }
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  })
    .format(date)
    .toUpperCase();
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

export function ShiftsTable({
  shifts,
  salesByShift,
  cashSalesByShift,
  ewalletSalesByShift,
  refundedSalesByShift,
  ticketsCountByShift,
  itemsByShift,
}: ShiftsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    date: "all",
    month: "",
  });
  const [sort, setSort] = useState("opened_desc");
  const [monthPickerYear, setMonthPickerYear] = useState(
    filters.month
      ? Number(filters.month.split("-")[0])
      : new Date().getFullYear(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleDateFilterChange = (value: string) => {
    if (value === "month") {
      const now = new Date();
      const currentMonth = formatMonthValue(now);
      setFilters((prev) => ({
        ...prev,
        date: value,
        month: prev.month || currentMonth,
      }));
      setMonthPickerYear(now.getFullYear());
      return;
    }

    setFilters((prev) => ({
      ...prev,
      date: value,
      month: value === "month" ? prev.month : "",
    }));
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteError(null);
      setDeleteTarget(null);
    }
  };

  const handleDeleteShift = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    const result = await deleteShift(deleteTarget.id);
    if (!result?.ok) {
      setDeleteError(result?.error ?? "Failed to delete shift.");
      setDeleteLoading(false);
      return;
    }
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    router.refresh();
  };

  const filteredShifts = useMemo(() => {
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

    const matchesSearch = (shift: ShiftSummary) => {
      if (!debouncedSearch) {
        return true;
      }
      const shiftCode = shift.shift_code || shift.label || shift.id;
      const openedBy = joinName(
        shift.profiles?.first_name ?? null,
        shift.profiles?.last_name ?? null,
      );
      const statusLabel = formatStatusLabel(shift.status, shift.end_at);
      return [shiftCode, openedBy, statusLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(debouncedSearch);
    };

    const matchesDate = (shift: ShiftSummary) => {
      if (!shift.start_at) {
        return false;
      }
      const openedAt = new Date(shift.start_at);
      if (filters.date === "all") {
        return true;
      }
      if (filters.date === "month" && monthStart && monthEnd) {
        return openedAt >= monthStart && openedAt <= monthEnd;
      }
      return true;
    };

    const filtered = shifts.filter(
      (shift) => matchesSearch(shift) && matchesDate(shift),
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const aOpened = a.start_at ? new Date(a.start_at).getTime() : 0;
      const bOpened = b.start_at ? new Date(b.start_at).getTime() : 0;
      const aSales = salesByShift[a.id] ?? 0;
      const bSales = salesByShift[b.id] ?? 0;
      if (sort === "opened_desc") {
        return bOpened - aOpened;
      }
      if (sort === "opened_asc") {
        return aOpened - bOpened;
      }
      if (sort === "sales_desc") {
        return bSales - aSales;
      }
      if (sort === "sales_asc") {
        return aSales - bSales;
      }
      return 0;
    });

    return sorted;
  }, [debouncedSearch, filters, salesByShift, shifts, sort]);

  const resetFilters = () => {
    setFilters({
      date: "all",
      month: "",
    });
    setSort("opened_desc");
    setSearchInput("");
    setMonthPickerYear(new Date().getFullYear());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.date} onValueChange={handleDateFilterChange}>
              <SelectTrigger className="h-9 w-37.5">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            {filters.date === "month" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 min-w-35 justify-between"
                    >
                      {formatMonthLabel(filters.month)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-65 p-3" align="start">
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-45">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opened_desc">
                  Opened date: Newest → Oldest
                </SelectItem>
                <SelectItem value="opened_asc">
                  Opened date: Oldest → Newest
                </SelectItem>
                <SelectItem value="sales_desc">Sales: High → Low</SelectItem>
                <SelectItem value="sales_asc">Sales: Low → High</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="shift-search"
                placeholder="Search shifts"
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
            Showing shifts for {formatMonthLabel(filters.month)}
          </p>
        ) : null}
      </div>
      {filteredShifts.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
            <Clock className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No shifts match your search"
                : "No shifts found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different shift code or name."
                : "Shift history will appear here once shifts are opened."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Shift
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Opened
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Closed
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Opened by
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sales
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift, index) => {
                const currentMonthKey = getMonthKey(shift.start_at);
                const previousMonthKey =
                  index > 0
                    ? getMonthKey(filteredShifts[index - 1].start_at)
                    : null;
                const isNewMonth =
                  index === 0 || currentMonthKey !== previousMonthKey;
                const monthGroupLabel = formatMonthGroupLabel(shift.start_at);
                const tone = getStatusTone(shift.status, shift.end_at);
                const shiftCode = shift.shift_code ?? null;
                const shiftLabel = shift.label ?? null;
                const shiftTitle = shiftCode || shiftLabel || shift.id;
                const openedBy = joinName(
                  shift.profiles?.first_name ?? null,
                  shift.profiles?.last_name ?? null,
                );
                const closedAt = isOpenStatus(shift.status, shift.end_at)
                  ? "-"
                  : formatDateTime(shift.end_at);
                const salesTotal = formatMoney(salesByShift[shift.id] ?? 0);
                const cashSalesTotal = formatMoney(
                  cashSalesByShift[shift.id] ?? 0,
                );
                const ewalletSalesTotal = formatMoney(
                  ewalletSalesByShift[shift.id] ?? 0,
                );
                const refundedSalesTotal = formatMoney(
                  refundedSalesByShift[shift.id] ?? 0,
                );
                const totalTickets = ticketsCountByShift[shift.id] ?? 0;
                const shiftItems = itemsByShift[shift.id] ?? [];
                const itemsTotal = shiftItems.reduce(
                  (total, item) => total + item.total,
                  0,
                );
                return (
                  <Fragment key={shift.id}>
                    {isNewMonth ? (
                      <TableRow className="bg-black hover:bg-black dark:bg-white dark:hover:bg-white">
                        <TableCell
                          colSpan={7}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white dark:text-black"
                        >
                          {monthGroupLabel}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    <TableRow className="bg-background hover:bg-muted/50">
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {shift.shift_code || shift.label || shift.id}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(shift.start_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {isOpenStatus(shift.status, shift.end_at)
                          ? "-"
                          : formatDateTime(shift.end_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-foreground">
                        {joinName(
                          shift.profiles?.first_name ?? null,
                          shift.profiles?.last_name ?? null,
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {formatMoney(salesByShift[shift.id] ?? 0)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={tone.badge}>
                          {formatStatusLabel(shift.status, shift.end_at)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex justify-end">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="icon" variant="outline">
                                <Pencil />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0">
                              <div className="flex h-full flex-col bg-muted/10">
                                <SheetHeader className="border-b bg-background px-6 py-4 pr-12">
                                  <SheetTitle className="text-base font-semibold text-foreground">
                                    {shiftTitle}
                                  </SheetTitle>
                                  <SheetDescription className="text-xs text-muted-foreground">
                                    Shift ID: {shift.id}
                                  </SheetDescription>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`h-6 px-2 text-[11px] ${tone.badge}`}
                                    >
                                      {formatStatusLabel(
                                        shift.status,
                                        shift.end_at,
                                      )}
                                    </Badge>
                                  </div>
                                </SheetHeader>
                                <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Shift details
                                      </p>
                                      <div className="divide-y divide-border/60 text-sm">
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Shift code
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {shiftCode ?? "-"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Opened
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {formatDateTime(shift.start_at)}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Closed
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {closedAt}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Opened by
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {openedBy}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Sales
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {salesTotal}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Refunded
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {refundedSalesTotal}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Cash
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {cashSalesTotal}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            E-wallet
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {ewalletSalesTotal}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                          <span className="text-muted-foreground">
                                            Total tickets
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {totalTickets}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Items sold
                                      </p>
                                      {shiftItems.length > 0 ? (
                                        <div className="divide-y divide-border/60 text-sm">
                                          {shiftItems.map((item) => (
                                            <div
                                              key={item.key}
                                              className="flex items-start justify-between gap-4 py-2"
                                            >
                                              <div className="min-w-0">
                                                <p className="font-medium text-foreground">
                                                  {item.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {item.type === "service"
                                                    ? "Service"
                                                    : "Product"}{" "}
                                                  - x{item.qty}
                                                </p>
                                              </div>
                                              <span className="font-medium text-foreground">
                                                {formatMoney(item.total)}
                                              </span>
                                            </div>
                                          ))}
                                          <div className="flex items-center justify-between py-2 font-semibold text-foreground">
                                            <span>Total</span>
                                            <span>
                                              {formatMoney(itemsTotal)}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No items recorded for this shift.
                                        </p>
                                      )}
                                    </div>
                                    <div className="pt-2">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          setDeleteTarget({
                                            id: shift.id,
                                            title: shiftTitle,
                                          });
                                          setDeleteDialogOpen(true);
                                          setDeleteError(null);
                                        }}
                                      >
                                        Delete shift
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete shift</DialogTitle>
            <DialogDescription>
              This will delete the shift and all related tickets and items. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Shift:{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.title ?? "-"}
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
              onClick={handleDeleteShift}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
