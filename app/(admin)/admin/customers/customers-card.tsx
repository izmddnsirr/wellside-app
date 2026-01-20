"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Pencil, Search, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  updateCustomerStatus: (formData: FormData) => Promise<void>;
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

export function CustomersCard({
  customers,
  errorMessage,
  updateCustomerStatus,
}: CustomersCardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "all" });
  const [sort, setSort] = useState("name_asc");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filteredCustomers = useMemo(() => {
    const matchesSearch = (customer: Customer) => {
      if (!debouncedSearch) {
        return true;
      }
      const name = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        name.includes(debouncedSearch) ||
        customer.email?.toLowerCase().includes(debouncedSearch) ||
        customer.phone?.toLowerCase().includes(debouncedSearch)
      );
    };

    const matchesStatus = (customer: Customer) => {
      if (filters.status === "all") {
        return true;
      }
      const isActive = Boolean(customer.is_active);
      return filters.status === "active" ? isActive : !isActive;
    };

    const filtered = customers.filter(
      (customer) => matchesSearch(customer) && matchesStatus(customer)
    );

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ");
      const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ");
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sort === "joined_desc") {
        return createdB - createdA;
      }
      if (sort === "joined_asc") {
        return createdA - createdB;
      }
      if (sort === "name_asc") {
        return nameA.localeCompare(nameB);
      }
      if (sort === "name_desc") {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return sorted;
  }, [customers, debouncedSearch, filters.status, sort]);

  const resetFilters = () => {
    setFilters({ status: "all" });
    setSort("name_asc");
    setSearchInput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="joined_desc">
                  Joined: Newest {"->"} Oldest
                </SelectItem>
                <SelectItem value="joined_asc">
                  Joined: Oldest {"->"} Newest
                </SelectItem>
                <SelectItem value="name_asc">Name: A {"->"} Z</SelectItem>
                <SelectItem value="name_desc">Name: Z {"->"} A</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="customer-search"
                placeholder="Search customers"
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
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : filteredCustomers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-[20%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-[26%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Joined
                </TableHead>
                <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const tone = getStatusTone(customer.is_active);
                const customerName =
                  [customer.first_name, customer.last_name]
                    .filter(Boolean)
                    .join(" ") || "-";
                const statusValue = customer.is_active ? "active" : "inactive";
                return (
                  <TableRow key={customer.id} className="bg-background hover:bg-muted/50">
                    <TableCell className="w-[20%] px-4 py-3 font-semibold text-foreground">
                      {customerName}
                    </TableCell>
                    <TableCell className="w-[26%] px-4 py-3 text-muted-foreground">
                      {customer.email || "-"}
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {customer.phone || "-"}
                    </TableCell>
                    <TableCell className="w-[12%] px-4 py-3">
                      <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-3 text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pencil />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage customer</DialogTitle>
                            <DialogDescription>
                              Review customer profile and status.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 text-sm text-foreground">
                            <div className="rounded-xl border border-border bg-muted/30 p-4">
                              <p className="text-base font-semibold text-foreground">
                                {customerName}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {customer.email || "-"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {customer.phone || "-"}
                              </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Status
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`gap-2 ${tone.badge}`}
                                >
                                  <span className={`size-2 rounded-full ${tone.dot}`} />
                                  {customer.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Joined
                                </p>
                                <p className="font-medium text-foreground">
                                  {formatDate(customer.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Customer ID
                              </p>
                              <p className="break-all text-xs font-medium text-foreground">
                                {customer.id}
                              </p>
                            </div>
                          </div>
                          <form action={updateCustomerStatus} className="space-y-4">
                            <input type="hidden" name="id" value={customer.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`customer-status-${customer.id}`}>
                                Status
                              </Label>
                              <Select
                                name="is_active"
                                defaultValue={statusValue}
                              >
                                <SelectTrigger id={`customer-status-${customer.id}`}>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="ghost" type="button">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button type="submit">Update status</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background">
            <UserX className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {debouncedSearch
                ? "No customers match your search"
                : "No customers found yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? "Try a different name, email, or phone."
                : "Your customer list will appear here."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
