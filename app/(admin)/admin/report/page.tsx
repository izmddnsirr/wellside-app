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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Relation<T> = T | T[] | null;

type ServiceRow = {
  name: string | null;
  base_price: number | null;
};

type TicketItemRow = {
  qty: number | null;
  unit_price: number | null;
  services: Relation<ServiceRow>;
};

type BarberRow = {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type TicketWithItemsRow = {
  id: string;
  total_amount: number | null;
  paid_at: string | null;
  ticket_items: TicketItemRow[] | null;
};

type WeeklyTicketRow = {
  id: string;
  total_amount: number | null;
  barber: Relation<BarberRow>;
};

type MonthlyTicketRow = {
  total_amount: number | null;
  paid_at: string | null;
};

type BookingDateRow = {
  booking_date: string | null;
};

type ReportPageProps = {
  searchParams?: Promise<{
    month?: string | string[];
  }>;
};

const resolveSingle = <T,>(value: Relation<T>) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

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
    parts.find((part) => part.type === "month")?.value ?? "0",
  );
  return { year, month };
};

const pad2 = (value: number) => String(value).padStart(2, "0");

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

const toAverageTicket = (totalSales: number, totalBookings: number) =>
  totalBookings > 0 ? totalSales / totalBookings : 0;

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

export default async function Page({ searchParams }: ReportPageProps) {
  const params = (await searchParams) ?? {};
  const rawMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const parsedMonth = parseMonthParam(rawMonth);
  const hasInvalidMonthParam = Boolean(rawMonth) && !parsedMonth;

  const currentMonthParts = getMalaysiaDateParts();
  const selectedYear = parsedMonth?.year ?? currentMonthParts.year;
  const selectedMonthNumber = parsedMonth?.month ?? currentMonthParts.month;
  const selectedMonthValue = `${selectedYear}-${pad2(selectedMonthNumber)}`;

  const supabase = await createAdminClient();
  const todayDate = getMalaysiaTodayString();
  const todayStartTimestamp = `${todayDate}T00:00:00+08:00`;
  const todayEndTimestamp = `${todayDate}T23:59:59.999+08:00`;
  const weekStartDate = new Date(`${todayDate}T00:00:00+08:00`);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStartDateString = getMalaysiaDateString(weekStartDate);
  const weekStartTimestamp = `${weekStartDateString}T00:00:00+08:00`;
  const monthStart = `${selectedYear}-${pad2(selectedMonthNumber)}-01`;
  const lastDayOfMonth = new Date(
    selectedYear,
    selectedMonthNumber,
    0,
  ).getDate();
  const monthEnd = `${selectedYear}-${pad2(selectedMonthNumber)}-${String(
    lastDayOfMonth,
  ).padStart(2, "0")}`;
  const monthStartTimestamp = `${monthStart}T00:00:00+08:00`;
  const monthEndTimestamp = `${monthEnd}T23:59:59.999+08:00`;
  const monthHeading = new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(Date.UTC(selectedYear, selectedMonthNumber - 1, 1)));

  const [
    { count: dailyBookingsCount, error: dailyBookingsError },
    { count: weeklyBookingsCount, error: weeklyBookingsError },
    { data: monthlyBookingsData, error: monthlyBookingsError },
    { data: dailyTicketsData, error: dailyTicketsError },
    { data: weeklyTicketsData, error: weeklyTicketsError },
    { data: monthlyTicketsData, error: monthlyTicketsError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", todayDate),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("booking_date", weekStartDateString)
      .lte("booking_date", todayDate),
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
        ticket_items (
          qty,
          unit_price,
          services:service_id (name, base_price)
        )
      `,
      )
      .eq("payment_status", "paid")
      .gte("paid_at", todayStartTimestamp)
      .lte("paid_at", todayEndTimestamp),
    supabase
      .from("tickets")
      .select(
        `
        id,
        total_amount,
        barber:barber_id (display_name, first_name, last_name)
      `,
      )
      .eq("payment_status", "paid")
      .gte("paid_at", weekStartTimestamp)
      .lte("paid_at", todayEndTimestamp),
    supabase
      .from("tickets")
      .select(
        `
        total_amount,
        paid_at
      `,
      )
      .eq("payment_status", "paid")
      .gte("paid_at", monthStartTimestamp)
      .lte("paid_at", monthEndTimestamp),
  ]);

  const hasError =
    Boolean(dailyBookingsError) ||
    Boolean(weeklyBookingsError) ||
    Boolean(monthlyBookingsError) ||
    Boolean(dailyTicketsError) ||
    Boolean(weeklyTicketsError) ||
    Boolean(monthlyTicketsError);

  const dailyBookings = dailyBookingsCount ?? 0;
  const weeklyBookings = weeklyBookingsCount ?? 0;
  const monthlyBookingsRows = (monthlyBookingsData ?? []) as BookingDateRow[];
  const monthlyBookings = monthlyBookingsRows.length;

  const dailyTickets = (dailyTicketsData ??
    []) as unknown as TicketWithItemsRow[];
  const weeklyTickets = (weeklyTicketsData ??
    []) as unknown as WeeklyTicketRow[];
  const monthlyTickets = (monthlyTicketsData ??
    []) as unknown as MonthlyTicketRow[];

  const dailySales = dailyTickets.reduce(
    (sum, ticket) => sum + (ticket.total_amount ?? 0),
    0,
  );
  const weeklySales = weeklyTickets.reduce(
    (sum, ticket) => sum + (ticket.total_amount ?? 0),
    0,
  );
  const monthlySales = monthlyTickets.reduce(
    (sum, ticket) => sum + (ticket.total_amount ?? 0),
    0,
  );

  const dailyServiceMap = new Map<
    string,
    { ticketIds: Set<string>; revenue: number }
  >();

  dailyTickets.forEach((ticket) => {
    ticket.ticket_items?.forEach((item) => {
      const service = resolveSingle(item.services);
      const name = service?.name?.trim();
      if (!name) {
        return;
      }

      const qty = item.qty ?? 0;
      const unitPrice =
        typeof item.unit_price === "number"
          ? item.unit_price
          : Number(service?.base_price ?? 0);

      const existing = dailyServiceMap.get(name) ?? {
        ticketIds: new Set<string>(),
        revenue: 0,
      };

      existing.ticketIds.add(ticket.id);
      existing.revenue += qty * unitPrice;
      dailyServiceMap.set(name, existing);
    });
  });

  const dailyServiceRows = Array.from(dailyServiceMap.entries())
    .map(([service, values]) => ({
      service,
      bookings: values.ticketIds.size,
      revenue: values.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const weeklyBarberMap = new Map<
    string,
    { ticketIds: Set<string>; revenue: number }
  >();

  weeklyTickets.forEach((ticket) => {
    const barberName = toBarberName(ticket.barber);
    const existing = weeklyBarberMap.get(barberName) ?? {
      ticketIds: new Set<string>(),
      revenue: 0,
    };

    existing.ticketIds.add(ticket.id);
    existing.revenue += ticket.total_amount ?? 0;
    weeklyBarberMap.set(barberName, existing);
  });

  const weeklyBarberRows = Array.from(weeklyBarberMap.entries())
    .map(([name, values]) => ({
      name,
      bookings: values.ticketIds.size,
      revenue: values.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const weeksInMonth = Math.ceil(lastDayOfMonth / 7);
  const monthlyWeekRows = Array.from({ length: weeksInMonth }, (_, index) => ({
    week: `Week ${index + 1}`,
    bookings: 0,
    revenue: 0,
  }));

  monthlyBookingsRows.forEach((booking) => {
    if (!booking.booking_date) {
      return;
    }
    const day = Number(booking.booking_date.split("-")[2] ?? "0");
    if (!day) {
      return;
    }
    const weekIndex = Math.floor((day - 1) / 7);
    const row = monthlyWeekRows[weekIndex];
    if (!row) {
      return;
    }
    row.bookings += 1;
  });

  monthlyTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const paidDateString = getMalaysiaDateString(new Date(ticket.paid_at));
    const day = Number(paidDateString.split("-")[2] ?? "0");
    if (!day) {
      return;
    }
    const weekIndex = Math.floor((day - 1) / 7);
    const row = monthlyWeekRows[weekIndex];
    if (!row) {
      return;
    }
    row.revenue += ticket.total_amount ?? 0;
  });

  const dailyStats = [
    { label: "Bookings", value: String(dailyBookings) },
    { label: "Total sales", value: formatCurrency(dailySales) },
    {
      label: "Avg ticket",
      value: formatCurrency(toAverageTicket(dailySales, dailyBookings)),
    },
  ];

  const weeklyStats = [
    { label: "Bookings", value: String(weeklyBookings) },
    { label: "Total sales", value: formatCurrency(weeklySales) },
    {
      label: "Avg ticket",
      value: formatCurrency(toAverageTicket(weeklySales, weeklyBookings)),
    },
  ];

  const monthlyStats = [
    { label: "Bookings", value: String(monthlyBookings) },
    { label: "Total sales", value: formatCurrency(monthlySales) },
    {
      label: "Avg ticket",
      value: formatCurrency(toAverageTicket(monthlySales, monthlyBookings)),
    },
  ];

  return (
    <AdminShell title="Reports">
      <div className="px-4 lg:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Viewing month:{" "}
            <span className="font-medium text-foreground">{monthHeading}</span>
          </p>
          <div className="flex items-end gap-2">
            <form method="get" className="flex items-end gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="month"
                  className="text-xs text-muted-foreground"
                >
                  Month
                </label>
                <Input
                  id="month"
                  name="month"
                  type="month"
                  defaultValue={selectedMonthValue}
                  className="w-45"
                />
              </div>
              <Button type="submit" size="sm">
                Apply
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/report">Current</Link>
              </Button>
            </form>
          </div>
        </div>

        {hasError ? (
          <p className="mb-4 text-sm text-red-600">
            Failed to load full report data. Showing available results.
          </p>
        ) : null}
        {hasInvalidMonthParam ? (
          <p className="mb-4 text-sm text-amber-600">
            Invalid month value. Showing current month instead.
          </p>
        ) : null}
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <div className="grid gap-4 lg:grid-cols-3">
              {dailyStats.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Daily service mix</CardTitle>
                <CardDescription>
                  Breakdown by service category.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyServiceRows.length > 0 ? (
                      dailyServiceRows.map((row) => (
                        <TableRow key={row.service}>
                          <TableCell className="font-medium">
                            {row.service}
                          </TableCell>
                          <TableCell>{row.bookings}</TableCell>
                          <TableCell>{formatCurrency(row.revenue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          No paid tickets yet for today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid gap-4 lg:grid-cols-3">
              {weeklyStats.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Weekly team performance</CardTitle>
                <CardDescription>Top barbers by revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barber</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyBarberRows.length > 0 ? (
                      weeklyBarberRows.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium">
                            {row.name}
                          </TableCell>
                          <TableCell>{row.bookings}</TableCell>
                          <TableCell>{formatCurrency(row.revenue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          No paid tickets yet in the past 7 days.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="grid gap-4 lg:grid-cols-3">
              {monthlyStats.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Monthly trends</CardTitle>
                <CardDescription>
                  Sales by week for {monthHeading}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyWeekRows.map((row) => (
                      <TableRow key={row.week}>
                        <TableCell className="font-medium">
                          {row.week}
                        </TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell>{formatCurrency(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
