import { AdminShell } from "./components/admin-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { BookingsChartCard } from "./components/bookings-chart-card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wellside+",
  description: "Wellside Barbershop booking and management system.",
};

const getMalaysiaDateString = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const getMalaysiaTodayString = () => getMalaysiaDateString(new Date());

const getMalaysiaDateParts = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(
    parts.find((part) => part.type === "month")?.value ?? "0"
  );
  return { year, month };
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatMonthValue = (value: Date) =>
  `${value.getFullYear()}-${pad2(value.getMonth() + 1)}`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

type TicketItemRow = {
  qty: number | null;
  unit_price?: number | null;
  services:
    | { name: string | null; base_price: number | null }
    | { name: string | null; base_price: number | null }[]
    | null;
};

type TicketRow = {
  id: string;
  total_amount: number | null;
  paid_at: string | null;
  ticket_items: TicketItemRow[] | null;
};

type SalesSummaryRow = {
  total_amount: number | null;
  paid_at: string | null;
};

type RecentTicketRow = {
  id: string;
  ticket_no: string | null;
  total_amount: number | null;
  payment_status: string | null;
  created_at: string | null;
  barber: { first_name: string | null; last_name: string | null } | null;
};

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kuala_Lumpur",
});

const formatTime = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return timeFormatter.format(date);
};

const formatShortTicketId = (ticketNo: string | null, id: string) =>
  ticketNo || id.slice(-6);

const getStatusTone = (status: string | null) => {
  const normalized = (status ?? "unpaid").toLowerCase();
  if (normalized === "paid") {
    return {
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Paid",
    };
  }
  if (normalized === "refunded") {
    return {
      badge: "bg-rose-100 text-rose-900 border-rose-200",
      dot: "bg-rose-500",
      label: "Refunded",
    };
  }
  return {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
    label: "Unpaid",
  };
};

export default async function Page() {
  const supabase = await createAdminClient();
  const todayDate = getMalaysiaTodayString();
  const todayStartTimestamp = `${todayDate}T00:00:00+08:00`;
  const todayEndTimestamp = `${todayDate}T23:59:59.999+08:00`;
  const { year, month } = getMalaysiaDateParts();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;
  const monthStartTimestamp = `${monthStart}T00:00:00+08:00`;
  const monthEndTimestamp = `${monthEnd}T23:59:59.999+08:00`;
  const rangeStartMonth = `${year}-01`;
  const defaultMonth = monthStart.slice(0, 7);
  const rangeStartTimestamp = `${rangeStartMonth}-01T00:00:00+08:00`;
  const weekStartDate = new Date(`${todayDate}T00:00:00+08:00`);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStartDateString = getMalaysiaDateString(weekStartDate);
  const weekStartTimestamp = `${weekStartDateString}T00:00:00+08:00`;

  const [
    { count: bookingsCount },
    { count: ticketsTodayCount },
    { data: salesRangeData },
    { data: salesMonthData },
    { data: salesWeekData },
    { data: recentTicketsData },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", todayDate),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStartTimestamp)
      .lte("created_at", todayEndTimestamp),
    supabase
      .from("tickets")
      .select("total_amount, paid_at")
      .eq("payment_status", "paid")
      .gte("paid_at", rangeStartTimestamp)
      .lte("paid_at", monthEndTimestamp),
    supabase
      .from("tickets")
      .select(
        `
        id,
        total_amount,
        paid_at,
        ticket_items (
          qty,
          unit_price,
          services:service_id (name, base_price)
        )
      `
      )
      .eq("payment_status", "paid")
      .gte("paid_at", monthStartTimestamp)
      .lte("paid_at", monthEndTimestamp),
    supabase
      .from("tickets")
      .select(
        `
        total_amount,
        paid_at
      `
      )
      .eq("payment_status", "paid")
      .gte("paid_at", weekStartTimestamp)
      .lte("paid_at", todayEndTimestamp),
    supabase
      .from("tickets")
      .select(
        `
        id,
        ticket_no,
        total_amount,
        payment_status,
        created_at,
        barber:barber_id (first_name, last_name)
      `
      )
      .gte("created_at", todayStartTimestamp)
      .lte("created_at", todayEndTimestamp)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalBookingsToday = bookingsCount ?? 0;
  const totalTicketsToday = ticketsTodayCount ?? 0;

  const salesTickets = (salesMonthData ?? []) as unknown as TicketRow[];
  const rangeTickets = (salesRangeData ?? []) as unknown as SalesSummaryRow[];
  const weekTickets = (salesWeekData ?? []) as unknown as SalesSummaryRow[];
  const recentTickets = (recentTicketsData ?? []).map((ticket) => ({
    ...ticket,
    barber: Array.isArray(ticket.barber)
      ? ticket.barber[0] ?? null
      : ticket.barber ?? null,
  })) as RecentTicketRow[];
  const totalSalesToday = salesTickets.reduce((total, ticket) => {
    if (!ticket.paid_at) {
      return total;
    }
    const paidDate = getMalaysiaDateString(new Date(ticket.paid_at));
    if (paidDate !== todayDate) {
      return total;
    }
    return total + (ticket.total_amount ?? 0);
  }, 0);
  const totalSalesThisMonth = salesTickets.reduce(
    (total, ticket) => total + (ticket.total_amount ?? 0),
    0
  );

  const rangeSalesMap = new Map<string, number>();
  rangeTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const dateKey = getMalaysiaDateString(new Date(ticket.paid_at));
    rangeSalesMap.set(
      dateKey,
      (rangeSalesMap.get(dateKey) ?? 0) + (ticket.total_amount ?? 0)
    );
  });
  const currentYearMonths = Array.from({ length: 12 }, (_, index) =>
    `${year}-${pad2(index + 1)}`
  );
  const dataMonths = Array.from(
    new Set(
      rangeTickets
        .filter((ticket) => ticket.paid_at)
        .map((ticket) => {
          const paidDate = new Date(ticket.paid_at as string);
          if (Number.isNaN(paidDate.getTime())) {
            return "";
          }
          return `${paidDate.getFullYear()}-${pad2(paidDate.getMonth() + 1)}`;
        })
        .filter(Boolean)
    )
  ).sort();
  const dataYears = Array.from(
    new Set(dataMonths.map((value) => Number(value.split("-")[0])))
  ).filter(Boolean);
  const monthOptions = Array.from(new Set([...currentYearMonths])).sort();
  const defaultMonthOption = defaultMonth;
  const monthSeries = Object.fromEntries(
    monthOptions.map((monthValue) => {
      const [monthYear, monthNumber] = monthValue.split("-").map(Number);
      const daysInMonth =
        monthYear && monthNumber
          ? new Date(monthYear, monthNumber, 0).getDate()
          : 0;
      const series = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dateKey = getMalaysiaDateString(
          new Date(Date.UTC(monthYear, monthNumber - 1, day))
        );
        return {
          date: dateKey,
          sales: rangeSalesMap.get(dateKey) ?? 0,
        };
      });
      return [monthValue, series];
    })
  );

  const weekSalesMap = new Map<string, number>();
  weekTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const dateKey = getMalaysiaDateString(new Date(ticket.paid_at));
    weekSalesMap.set(
      dateKey,
      (weekSalesMap.get(dateKey) ?? 0) + (ticket.total_amount ?? 0)
    );
  });
  const weekSalesData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    const dateKey = getMalaysiaDateString(date);
    return {
      date: dateKey,
      sales: weekSalesMap.get(dateKey) ?? 0,
    };
  });

  const yearSalesMap = new Map<number, Map<string, number>>();
  rangeTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const paidDate = new Date(ticket.paid_at);
    if (Number.isNaN(paidDate.getTime())) {
      return;
    }
    const paidYear = paidDate.getFullYear();
    const monthKey = `${paidYear}-${pad2(paidDate.getMonth() + 1)}`;
    const yearBucket = yearSalesMap.get(paidYear) ?? new Map<string, number>();
    yearBucket.set(
      monthKey,
      (yearBucket.get(monthKey) ?? 0) + (ticket.total_amount ?? 0)
    );
    yearSalesMap.set(paidYear, yearBucket);
  });
  const availableYears = Array.from(
    new Set(monthOptions.map((value) => Number(value.split("-")[0])))
  ).filter(Boolean);
  const yearSeries = Object.fromEntries(
    availableYears.map((yearValue) => {
      const bucket = yearSalesMap.get(yearValue) ?? new Map<string, number>();
      const series = Array.from({ length: 12 }, (_, index) => {
        const monthKey = `${yearValue}-${pad2(index + 1)}`;
        return {
          date: monthKey,
          sales: bucket.get(monthKey) ?? 0,
        };
      });
      return [String(yearValue), series];
    })
  );

  const serviceMap = new Map<string, { ticketIds: Set<string>; revenue: number }>();
  salesTickets.forEach((ticket) => {
    ticket.ticket_items?.forEach((item) => {
      const service = Array.isArray(item.services)
        ? item.services[0] ?? null
        : item.services ?? null;
      const name = service?.name?.trim();
      if (!name) {
        return;
      }
      const qty = item.qty ?? 0;
      const price =
        typeof item.unit_price === "number"
          ? item.unit_price
          : Number(service?.base_price ?? 0);
      const current = serviceMap.get(name) ?? {
        ticketIds: new Set<string>(),
        revenue: 0,
      };
      current.ticketIds.add(ticket.id);
      current.revenue += qty * price;
      serviceMap.set(name, current);
    });
  });
  const topServices = Array.from(serviceMap.entries())
    .map(([name, values]) => ({
      name,
      ticketCount: values.ticketIds.size,
      revenue: values.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <AdminShell
      title="Dashboard"
      description="Quick overview of today's performance."
    >
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Total bookings
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {totalBookingsToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on bookings for today.
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Total tickets today
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {totalTicketsToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on tickets created today.
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Total sales today
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {formatCurrency(totalSalesToday)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on paid tickets today.
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Total sales this month
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {formatCurrency(totalSalesThisMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on paid tickets this month.
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <BookingsChartCard
          data={{
            week: weekSalesData,
          }}
          monthSeries={monthSeries}
          yearSeries={yearSeries}
          defaultMonth={defaultMonthOption}
          availableMonths={monthOptions}
          dataMonths={dataMonths}
          availableYears={availableYears}
          dataYears={dataYears}
        />
      </div>
      <div className="px-4 lg:px-6">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Top services</CardTitle>
            <CardDescription className="text-muted-foreground">
              Best selling services this month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {topServices.length === 0 ? (
              <p className="text-muted-foreground">No services data yet.</p>
            ) : (
              topServices.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.ticketCount} tickets
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(service.revenue)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent tickets</CardTitle>
            <CardDescription className="text-muted-foreground">
              Last 10 tickets created today.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {recentTickets.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                No tickets yet for today.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/60">
                      <TableHead className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="w-[20%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Ticket
                      </TableHead>
                      <TableHead className="w-[28%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Barber
                      </TableHead>
                      <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Total
                      </TableHead>
                      <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTickets.map((ticket) => {
                      const barberName =
                        [ticket.barber?.first_name, ticket.barber?.last_name]
                          .filter(Boolean)
                          .join(" ") || "-";
                      const statusTone = getStatusTone(ticket.payment_status);
                      const href = `/tickets/${ticket.id}`;
                      return (
                        <TableRow
                          key={ticket.id}
                          className="bg-background hover:bg-muted/50"
                        >
                          <TableCell className="px-4 py-3 text-muted-foreground">
                            <Link href={href} className="block w-full">
                              {formatTime(ticket.created_at)}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 font-semibold text-foreground">
                            <Link href={href} className="block w-full">
                              {formatShortTicketId(ticket.ticket_no, ticket.id)}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-foreground">
                            <Link href={href} className="block w-full">
                              {barberName}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-foreground">
                            <Link href={href} className="block w-full">
                              {ticket.total_amount === null
                                ? "-"
                                : formatCurrency(ticket.total_amount)}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Link href={href} className="block w-full">
                              <Badge
                                variant="outline"
                                className={`gap-2 ${statusTone.badge}`}
                              >
                                <span
                                  className={`size-2 rounded-full ${statusTone.dot}`}
                                />
                                {statusTone.label}
                              </Badge>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
