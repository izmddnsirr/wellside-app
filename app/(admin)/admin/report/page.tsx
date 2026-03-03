import { AdminShell } from "../components/admin-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReportMonthPicker } from "./report-month-picker";

type Relation<T> = T | T[] | null;

type ServiceRow = {
  name: string | null;
  base_price: number | null;
};

type ProductRow = {
  name: string | null;
  base_price: number | null;
};

type TicketItemRow = {
  qty: number | null;
  unit_price: number | null;
  services: Relation<ServiceRow>;
  products: Relation<ProductRow>;
};

type BarberRow = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type TicketRow = {
  id: string;
  total_amount: number | null;
  paid_at: string | null;
  barber: Relation<BarberRow>;
  ticket_items: TicketItemRow[] | null;
};

type BookingDateRow = {
  booking_date: string | null;
};

type MonthSourceBookingRow = {
  booking_date: string | null;
};

type MonthSourceTicketRow = {
  paid_at: string | null;
};

type SalesOnlyTicketRow = {
  total_amount: number | null;
};

type ReportPageProps = {
  searchParams?: Promise<{
    month?: string | string[];
  }>;
};

type DailyRow = {
  date: string;
  dayLabel: string;
  bookings: number;
  paidTickets: number;
  sales: number;
};

type WeeklyRow = {
  weekLabel: string;
  bookings: number;
  paidTickets: number;
  sales: number;
};

const resolveSingle = <T,>(value: Relation<T>) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

const pad2 = (value: number) => String(value).padStart(2, "0");

const getMalaysiaDateString = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const getMalaysiaDateParts = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  return { year, month };
};

const parseMonthParam = (value: string | undefined) => {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearString, monthString] = value.split("-");
  const parsedYear = Number(yearString);
  const parsedMonth = Number(monthString);

  if (!parsedYear || parsedMonth < 1 || parsedMonth > 12) {
    return null;
  }

  return {
    year: parsedYear,
    month: parsedMonth,
    value: `${parsedYear}-${pad2(parsedMonth)}`,
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

const toAverageTicket = (totalSales: number, paidTickets: number) =>
  paidTickets > 0 ? totalSales / paidTickets : 0;

const formatDelta = (currentValue: number, previousValue: number) => {
  if (previousValue === 0) {
    return currentValue === 0 ? "0% vs prev month" : "New vs prev month";
  }
  const diff = ((currentValue - previousValue) / previousValue) * 100;
  const prefix = diff > 0 ? "+" : "";
  return `${prefix}${diff.toFixed(1)}% vs prev month`;
};

const toBarberName = (barber: Relation<BarberRow>) => {
  const person = resolveSingle(barber);
  if (!person) {
    return "Unassigned";
  }
  return (
    person.display_name?.trim() ||
    [person.first_name, person.last_name].filter(Boolean).join(" ") ||
    "Unassigned"
  );
};

const toMonthHeading = (year: number, month: number) =>
  new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

const getMonthRange = (year: number, month: number) => {
  const lastDay = new Date(year, month, 0).getDate();
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEnd = `${year}-${pad2(month)}-${pad2(lastDay)}`;

  return {
    lastDay,
    monthStart,
    monthEnd,
    monthStartTimestamp: `${monthStart}T00:00:00+08:00`,
    monthEndTimestamp: `${monthEnd}T23:59:59.999+08:00`,
  };
};

const getPreviousMonth = (year: number, month: number) => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
};

const getDayLabel = (year: number, month: number, day: number) =>
  new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(Date.UTC(year, month - 1, day)));

const toWeekIndex = (year: number, month: number, day: number) => {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstDow = firstDay.getUTCDay();
  const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
  return Math.floor((mondayOffset + day - 1) / 7);
};

const getShortDateLabel = (year: number, month: number, day: number) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(Date.UTC(year, month - 1, day)));

const reportTableHeadClass =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const reportTableRowClass = "bg-background hover:bg-muted/50";
const reportTableCellClass = "px-4 py-3";

export default async function Page({ searchParams }: ReportPageProps) {
  const params = (await searchParams) ?? {};
  const rawMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const parsedMonth = parseMonthParam(rawMonth);
  const hasInvalidMonthParam = Boolean(rawMonth) && !parsedMonth;

  const currentMonthParts = getMalaysiaDateParts();
  const selectedYear = parsedMonth?.year ?? currentMonthParts.year;
  const selectedMonth = parsedMonth?.month ?? currentMonthParts.month;
  const selectedMonthValue = `${selectedYear}-${pad2(selectedMonth)}`;

  const {
    lastDay,
    monthStart,
    monthEnd,
    monthStartTimestamp,
    monthEndTimestamp,
  } = getMonthRange(selectedYear, selectedMonth);
  const monthHeading = toMonthHeading(selectedYear, selectedMonth);

  const previousMonth = getPreviousMonth(selectedYear, selectedMonth);
  const prevRange = getMonthRange(previousMonth.year, previousMonth.month);

  const supabase = await createAdminClient();

  const [
    monthBookingsResult,
    monthTicketsResult,
    prevBookingsResult,
    prevTicketsResult,
    monthSourceBookingsResult,
    monthSourceTicketsResult,
  ] = await Promise.all([
      supabase
        .from("bookings")
        .select("booking_date")
        .gte("booking_date", monthStart)
        .lte("booking_date", monthEnd),
      supabase
        .from("tickets")
        .select(
          `
          id,
          total_amount,
          paid_at,
          barber:barber_id (display_name, first_name, last_name),
          ticket_items (
            qty,
            unit_price,
            services:service_id (name, base_price),
            products:product_id (name, base_price)
          )
        `,
        )
        .eq("payment_status", "paid")
        .gte("paid_at", monthStartTimestamp)
        .lte("paid_at", monthEndTimestamp),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("booking_date", prevRange.monthStart)
        .lte("booking_date", prevRange.monthEnd),
      supabase
        .from("tickets")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("paid_at", prevRange.monthStartTimestamp)
        .lte("paid_at", prevRange.monthEndTimestamp),
      supabase
        .from("bookings")
        .select("booking_date")
        .not("booking_date", "is", null),
      supabase
        .from("tickets")
        .select("paid_at")
        .eq("payment_status", "paid")
        .not("paid_at", "is", null),
    ]);

  const hasError =
    Boolean(monthBookingsResult.error) ||
    Boolean(monthTicketsResult.error) ||
    Boolean(prevBookingsResult.error) ||
    Boolean(prevTicketsResult.error) ||
    Boolean(monthSourceBookingsResult.error) ||
    Boolean(monthSourceTicketsResult.error);

  const monthlyBookingsRows = (monthBookingsResult.data ?? []) as BookingDateRow[];
  const monthlyTickets = (monthTicketsResult.data ?? []) as unknown as TicketRow[];
  const previousBookings = prevBookingsResult.count ?? 0;
  const previousTickets = (prevTicketsResult.data ?? []) as SalesOnlyTicketRow[];
  const monthSourceBookings = (monthSourceBookingsResult.data ?? []) as MonthSourceBookingRow[];
  const monthSourceTickets = (monthSourceTicketsResult.data ?? []) as MonthSourceTicketRow[];

  const dataMonthsSet = new Set<string>();
  monthSourceBookings.forEach((row) => {
    const date = row.booking_date;
    if (!date || date.length < 7) {
      return;
    }
    dataMonthsSet.add(date.slice(0, 7));
  });
  monthSourceTickets.forEach((row) => {
    const paidAt = row.paid_at;
    if (!paidAt) {
      return;
    }
    const date = new Date(paidAt);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    dataMonthsSet.add(monthValue);
  });
  dataMonthsSet.add(selectedMonthValue);
  const dataMonths = Array.from(dataMonthsSet).sort();

  const bookingsByDate = new Map<string, number>();
  monthlyBookingsRows.forEach((row) => {
    if (!row.booking_date) {
      return;
    }
    bookingsByDate.set(row.booking_date, (bookingsByDate.get(row.booking_date) ?? 0) + 1);
  });

  const ticketStatsByDate = new Map<string, { paidTickets: number; sales: number }>();
  monthlyTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const dateKey = getMalaysiaDateString(new Date(ticket.paid_at));
    const existing = ticketStatsByDate.get(dateKey) ?? { paidTickets: 0, sales: 0 };
    existing.paidTickets += 1;
    existing.sales += ticket.total_amount ?? 0;
    ticketStatsByDate.set(dateKey, existing);
  });

  const dailyRows: DailyRow[] = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = `${selectedYear}-${pad2(selectedMonth)}-${pad2(day)}`;
    const bookingCount = bookingsByDate.get(date) ?? 0;
    const ticketStats = ticketStatsByDate.get(date) ?? { paidTickets: 0, sales: 0 };

    return {
      date,
      dayLabel: getDayLabel(selectedYear, selectedMonth, day),
      bookings: bookingCount,
      paidTickets: ticketStats.paidTickets,
      sales: ticketStats.sales,
    };
  });

  const weeklyAccumulator = new Map<
    number,
    {
      startDay: number;
      endDay: number;
      bookings: number;
      paidTickets: number;
      sales: number;
    }
  >();

  dailyRows.forEach((row) => {
    const day = Number(row.date.split("-")[2] ?? "0");
    if (!day) {
      return;
    }
    const weekIndex = toWeekIndex(selectedYear, selectedMonth, day);
    const current = weeklyAccumulator.get(weekIndex) ?? {
      startDay: day,
      endDay: day,
      bookings: 0,
      paidTickets: 0,
      sales: 0,
    };

    current.startDay = Math.min(current.startDay, day);
    current.endDay = Math.max(current.endDay, day);
    current.bookings += row.bookings;
    current.paidTickets += row.paidTickets;
    current.sales += row.sales;

    weeklyAccumulator.set(weekIndex, current);
  });

  const weeklyRows: WeeklyRow[] = Array.from(weeklyAccumulator.entries())
    .sort(([a], [b]) => a - b)
    .map(([index, row]) => ({
      weekLabel: `Week ${index + 1} (${getShortDateLabel(
        selectedYear,
        selectedMonth,
        row.startDay,
      )} - ${getShortDateLabel(selectedYear, selectedMonth, row.endDay)})`,
      bookings: row.bookings,
      paidTickets: row.paidTickets,
      sales: row.sales,
    }));

  const totalBookings = dailyRows.reduce((sum, row) => sum + row.bookings, 0);
  const totalPaidTickets = dailyRows.reduce((sum, row) => sum + row.paidTickets, 0);
  const totalSales = dailyRows.reduce((sum, row) => sum + row.sales, 0);
  const averageTicket = toAverageTicket(totalSales, totalPaidTickets);

  const previousSales = previousTickets.reduce(
    (sum, ticket) => sum + (ticket.total_amount ?? 0),
    0,
  );

  const barberMap = new Map<string, { paidTickets: number; sales: number }>();
  monthlyTickets.forEach((ticket) => {
    const name = toBarberName(ticket.barber);
    const existing = barberMap.get(name) ?? { paidTickets: 0, sales: 0 };
    existing.paidTickets += 1;
    existing.sales += ticket.total_amount ?? 0;
    barberMap.set(name, existing);
  });

  const topBarbers = Array.from(barberMap.entries())
    .map(([name, value]) => ({
      name,
      paidTickets: value.paidTickets,
      sales: value.sales,
    }))
    .sort((a, b) => b.sales - a.sales);

  const serviceMap = new Map<string, { qty: number; sales: number }>();
  monthlyTickets.forEach((ticket) => {
    ticket.ticket_items?.forEach((item) => {
      const service = resolveSingle(item.services);
      const serviceName = service?.name?.trim();
      if (!serviceName) {
        return;
      }

      const qty = item.qty ?? 0;
      const unitPrice =
        typeof item.unit_price === "number" ? item.unit_price : (service?.base_price ?? 0);

      const existing = serviceMap.get(serviceName) ?? { qty: 0, sales: 0 };
      existing.qty += qty;
      existing.sales += qty * unitPrice;
      serviceMap.set(serviceName, existing);
    });
  });

  const topServices = Array.from(serviceMap.entries())
    .map(([name, value]) => ({
      name,
      qty: value.qty,
      sales: value.sales,
    }))
    .sort((a, b) => b.sales - a.sales);

  const productMap = new Map<string, { qty: number; sales: number }>();
  monthlyTickets.forEach((ticket) => {
    ticket.ticket_items?.forEach((item) => {
      const product = resolveSingle(item.products);
      const productName = product?.name?.trim();
      if (!productName) {
        return;
      }

      const qty = item.qty ?? 0;
      const unitPrice =
        typeof item.unit_price === "number" ? item.unit_price : (product?.base_price ?? 0);

      const existing = productMap.get(productName) ?? { qty: 0, sales: 0 };
      existing.qty += qty;
      existing.sales += qty * unitPrice;
      productMap.set(productName, existing);
    });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([name, value]) => ({
      name,
      qty: value.qty,
      sales: value.sales,
    }))
    .sort((a, b) => b.sales - a.sales);

  const summaryCards = [
    {
      label: "Total bookings",
      value: totalBookings.toLocaleString("en-MY"),
      delta: formatDelta(totalBookings, previousBookings),
    },
    {
      label: "Paid tickets",
      value: totalPaidTickets.toLocaleString("en-MY"),
      delta: formatDelta(totalPaidTickets, previousTickets.length),
    },
    {
      label: "Total sales",
      value: formatCurrency(totalSales),
      delta: formatDelta(totalSales, previousSales),
    },
    {
      label: "Avg ticket",
      value: formatCurrency(averageTicket),
      delta: formatDelta(averageTicket, toAverageTicket(previousSales, previousTickets.length)),
    },
  ];

  return (
    <AdminShell title="Reports">
      <div className="px-4 lg:px-6">
        <div className="space-y-4 md:space-y-6">
          <section className="flex justify-end">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ReportMonthPicker
              selectedMonth={selectedMonthValue}
              dataMonths={dataMonths}
              className="h-9 w-32 sm:w-36"
            />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 w-32 px-4 sm:w-36"
            >
              <Link href="/admin/report">Current</Link>
            </Button>
          </div>
          </section>

          {hasError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Some report data failed to load. Showing available results.
            </p>
          ) : null}
          {hasInvalidMonthParam ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Invalid month parameter. Falling back to current month.
            </p>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="space-y-1 pb-3">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-2xl">{card.value}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{card.delta}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:w-90">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
                <CardDescription>
                  Daily performance across {monthHeading}. Values are based on booking date and paid ticket date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border/60">
                        <TableHead className={reportTableHeadClass}>Date</TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Bookings
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Paid tickets
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Sales
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Avg ticket
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyRows.map((row) => (
                        <TableRow key={row.date} className={reportTableRowClass}>
                          <TableCell className={`${reportTableCellClass} font-medium`}>
                            {row.dayLabel}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {row.bookings}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {row.paidTickets}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {formatCurrency(row.sales)}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {formatCurrency(toAverageTicket(row.sales, row.paidTickets))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>
                  Weeks are grouped by calendar week (Mon-Sun) within {monthHeading}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border/60">
                        <TableHead className={reportTableHeadClass}>Week</TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Bookings
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Paid tickets
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Sales
                        </TableHead>
                        <TableHead className={reportTableHeadClass}>
                          Avg ticket
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyRows.map((row) => (
                        <TableRow key={row.weekLabel} className={reportTableRowClass}>
                          <TableCell className={`${reportTableCellClass} font-medium`}>
                            {row.weekLabel}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {row.bookings}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {row.paidTickets}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {formatCurrency(row.sales)}
                          </TableCell>
                          <TableCell className={reportTableCellClass}>
                            {formatCurrency(toAverageTicket(row.sales, row.paidTickets))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Barbers</CardTitle>
                  <CardDescription>
                    Ranked by paid sales for {monthHeading}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/60">
                          <TableHead className={reportTableHeadClass}>Barber</TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Paid tickets
                          </TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Sales
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topBarbers.length > 0 ? (
                          topBarbers.map((row) => (
                            <TableRow key={row.name} className={reportTableRowClass}>
                              <TableCell className={`${reportTableCellClass} font-medium`}>
                                {row.name}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {row.paidTickets}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {formatCurrency(row.sales)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className={reportTableRowClass}>
                            <TableCell
                              colSpan={3}
                              className={`${reportTableCellClass} text-muted-foreground`}
                            >
                              No paid tickets in this month.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Services</CardTitle>
                  <CardDescription>
                    Service demand and revenue in {monthHeading}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/60">
                          <TableHead className={reportTableHeadClass}>Service</TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Units sold
                          </TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Sales
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topServices.length > 0 ? (
                          topServices.map((row) => (
                            <TableRow key={row.name} className={reportTableRowClass}>
                              <TableCell className={`${reportTableCellClass} font-medium`}>
                                {row.name}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {row.qty}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {formatCurrency(row.sales)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className={reportTableRowClass}>
                            <TableCell
                              colSpan={3}
                              className={`${reportTableCellClass} text-muted-foreground`}
                            >
                              No service sales in this month.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>
                    Product demand and revenue in {monthHeading}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border/60">
                          <TableHead className={reportTableHeadClass}>Product</TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Units sold
                          </TableHead>
                          <TableHead className={reportTableHeadClass}>
                            Sales
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.length > 0 ? (
                          topProducts.map((row) => (
                            <TableRow key={row.name} className={reportTableRowClass}>
                              <TableCell className={`${reportTableCellClass} font-medium`}>
                                {row.name}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {row.qty}
                              </TableCell>
                              <TableCell className={reportTableCellClass}>
                                {formatCurrency(row.sales)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className={reportTableRowClass}>
                            <TableCell
                              colSpan={3}
                              className={`${reportTableCellClass} text-muted-foreground`}
                            >
                              No product sales in this month.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminShell>
  );
}
