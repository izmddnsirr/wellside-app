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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarX, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

type ShiftSummary = {
  id: string;
  shift_code: string | null;
  label: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

type ShiftsTableProps = {
  shifts: ShiftSummary[];
  salesByShift: Record<string, number>;
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

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);

const normalizeStatus = (status: string | null) => status?.toLowerCase() ?? "";

const isOpenStatus = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "open" || normalized === "active";
};

const isClosedStatus = (status: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "closed" || normalized === "inactive";
};

const getStatusTone = (status: string | null) => {
  if (isOpenStatus(status)) {
    return {
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  if (isClosedStatus(status)) {
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

const formatStatusLabel = (status: string | null) => {
  if (isOpenStatus(status)) {
    return "Open";
  }
  if (isClosedStatus(status)) {
    return "Closed";
  }
  return status ?? "Unknown";
};

const joinName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ") || "Unknown";

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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ShiftsTable({ shifts, salesByShift }: ShiftsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    date: "all",
    dateFrom: "",
    dateTo: "",
    month: "",
  });
  const [sort, setSort] = useState("opened_desc");
  const [range, setRange] = useState<DateRange | undefined>();
  const [monthPickerYear, setMonthPickerYear] = useState(
    filters.month ? Number(filters.month.split("-")[0]) : new Date().getFullYear()
  );

  useEffect(() => {
    if (filters.date !== "month" || filters.month) {
      return;
    }
    const now = new Date();
    const currentMonth = formatMonthValue(now);
    setFilters((prev) => ({ ...prev, month: currentMonth }));
    setMonthPickerYear(now.getFullYear());
  }, [filters.date, filters.month]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filteredShifts = useMemo(() => {
    const now = new Date();
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

    const matchesSearch = (shift: ShiftSummary) => {
      if (!debouncedSearch) {
        return true;
      }
      const shiftCode = shift.shift_code || shift.label || shift.id;
      const openedBy = joinName(
        shift.profiles?.first_name ?? null,
        shift.profiles?.last_name ?? null
      );
      const statusLabel = formatStatusLabel(shift.status);
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
      if (filters.date === "custom" && isCustomRangeValid) {
        return (
          openedAt >= startOfDay(customStart) &&
          openedAt <= endOfDay(customEnd)
        );
      }
      return true;
    };

    const filtered = shifts.filter(
      (shift) => matchesSearch(shift) && matchesDate(shift)
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
      dateFrom: "",
      dateTo: "",
      month: "",
    });
    setSort("opened_desc");
    setSearchInput("");
    setRange(undefined);
    setMonthPickerYear(new Date().getFullYear());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.date}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, date: value }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All shifts</SelectItem>
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
                      className="h-9 min-w-[180px] justify-between"
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
                      <div className="text-sm font-semibold">{monthPickerYear}</div>
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
              <div className="flex flex-wrap items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 min-w-[220px] justify-between text-left"
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
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opened_desc">Opened date: Newest → Oldest</SelectItem>
                <SelectItem value="opened_asc">Opened date: Oldest → Newest</SelectItem>
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
        {filters.date === "custom" ? null : null}
      </div>
      {filteredShifts.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
            <CalendarX className="size-8 text-muted-foreground" />
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
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift) => {
                const tone = getStatusTone(shift.status);
                return (
                  <TableRow
                    key={shift.id}
                    className="bg-white hover:bg-slate-50/70"
                  >
                    <TableCell className="px-4 py-3 font-semibold text-slate-900">
                      {shift.shift_code || shift.label || shift.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600">
                      {formatDateTime(shift.start_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600">
                      {isOpenStatus(shift.status)
                        ? "-"
                        : formatDateTime(shift.end_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {joinName(
                        shift.profiles?.first_name ?? null,
                        shift.profiles?.last_name ?? null
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(salesByShift[shift.id] ?? 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {formatStatusLabel(shift.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
