"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const customerStatusClass = (isActive: boolean | null) =>
  isActive
    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
    : "bg-rose-100 text-rose-900 border-rose-200";

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
    <Card>
      <CardHeader>
        <CardTitle>Customer directory</CardTitle>
        <CardDescription>Keep track of customer contact details.</CardDescription>
        <CardAction>
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
        </CardAction>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : filteredCustomers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Name</TableHead>
                <TableHead className="w-[28%]">Email</TableHead>
                <TableHead className="w-[18%]">Phone</TableHead>
                <TableHead className="w-[14%]">Status</TableHead>
                <TableHead className="w-[18%]">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="w-[22%] font-medium">
                    {[customer.first_name, customer.last_name]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </TableCell>
                  <TableCell className="w-[28%]">
                    {customer.email || "-"}
                  </TableCell>
                  <TableCell className="w-[18%]">
                    {customer.phone || "-"}
                  </TableCell>
                  <TableCell className="w-[14%]">
                    <Badge
                      variant="outline"
                      className={customerStatusClass(customer.is_active)}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[18%]">
                    {formatDate(customer.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      </CardContent>
    </Card>
  );
}
