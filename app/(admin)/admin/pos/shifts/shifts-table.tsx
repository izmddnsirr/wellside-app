"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export function ShiftsTable({ shifts, salesByShift }: ShiftsTableProps) {
  const [query, setQuery] = useState("");
  const filteredShifts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return shifts;
    }
    return shifts.filter((shift) => {
      const shiftCode = shift.shift_code || shift.label || shift.id;
      const openedBy = joinName(
        shift.profiles?.first_name ?? null,
        shift.profiles?.last_name ?? null
      );
      return [shiftCode, shift.status, openedBy]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(trimmed);
    });
  }, [query, shifts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Shift history</h3>
          <p className="text-xs text-muted-foreground">
            Past shifts and totals.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="shift-search"
            placeholder="Search shifts"
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
                <TableRow key={shift.id} className="bg-white hover:bg-slate-50/70">
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
    </div>
  );
}
