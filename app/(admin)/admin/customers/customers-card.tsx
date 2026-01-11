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
import { Search, UserX } from "lucide-react";
import { useMemo, useState } from "react";

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type CustomersCardProps = {
  customers: Customer[];
  errorMessage?: string | null;
};

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

const getStatusTone = (isActive: boolean | null) =>
  isActive
    ? {
        badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
        dot: "bg-emerald-500",
      }
    : {
        badge: "bg-rose-100 text-rose-900 border-rose-200",
        dot: "bg-rose-500",
      };

export function CustomersCard({ customers, errorMessage }: CustomersCardProps) {
  const [query, setQuery] = useState("");
  const filteredCustomers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return customers;
    }
    return customers.filter((customer) => {
      const name = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(trimmed) ||
        customer.email?.toLowerCase().includes(trimmed) ||
        customer.phone?.toLowerCase().includes(trimmed)
      );
    });
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Customer directory</h3>
          <p className="text-xs text-muted-foreground">
            Keep track of customer contact details.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="customer-search"
            placeholder="Search customers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-56 pl-9"
          />
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : filteredCustomers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-[28%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Joined
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const tone = getStatusTone(customer.is_active);
                return (
                  <TableRow key={customer.id} className="bg-white hover:bg-slate-50/70">
                    <TableCell className="w-[22%] px-4 py-3 font-semibold text-slate-900">
                      {[customer.first_name, customer.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell className="w-[28%] px-4 py-3 text-slate-600">
                      {customer.email || "-"}
                    </TableCell>
                    <TableCell className="w-[18%] px-4 py-3 text-slate-600">
                      {customer.phone || "-"}
                    </TableCell>
                    <TableCell className="w-[14%] px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[18%] px-4 py-3 text-slate-600">
                      {formatDate(customer.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <UserX className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">No customers found yet</p>
            <p className="text-sm text-muted-foreground">
              Your customer list will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
