import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/utils/supabase/server";
import { CalendarDays, Clock3, DollarSign } from "lucide-react";
import Link from "next/link";
import { BookingsChartCard } from "./components/bookings-chart-card";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

type TicketRow = {
  total_amount: number | null;
  paid_at: string | null;
};

type SalesSummaryRow = {
  total_amount: number | null;
  paid_at: string | null;
  payment_method: string | null;
};

type TodayPaymentRow = {
  total_amount: number | null;
  payment_method: string | null;
};

type TodayBarberBookingRow = {
  barber_id: string | null;
};

type LowStockRow = {
  id: string;
  name: string | null;
  stock_qty: number | null;
};

const quickActions = [
  {
    href: "/admin/pos",
    label: "POS",
    icon: DollarSign,
    featured: true,
  },
  {
    href: "/admin/bookings",
    label: "Queue",
    icon: Clock3,
    featured: false,
  },
  {
    href: "/admin/bookings/calendar",
    label: "Calendar",
    icon: CalendarDays,
    featured: false,
  },
] as const;

export async function DashboardContent() {
  const supabase = await createAdminClient();
  const todayDate = getMalaysiaTodayString();
  const todayStartTimestamp = `${todayDate}T00:00:00+08:00`;
  const todayEndTimestamp = `${todayDate}T23:59:59.999+08:00`;
  const { year, month } = getMalaysiaDateParts();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;
  const monthStartTimestamp = `${monthStart}T00:00:00+08:00`;
  const monthEndTimestamp = `${monthEnd}T23:59:59.999+08:00`;
  const rangeStartMonth = `${year}-01`;
  const defaultMonth = monthStart.slice(0, 7);
  const rangeStartTimestamp = `${rangeStartMonth}-01T00:00:00+08:00`;
  const weekStartDate = new Date(`${todayDate}T00:00:00+08:00`);
  weekStartDate.setDate(weekStartDate.getDate() - 6);

  const [
    { count: bookingsCount },
    { count: ticketsTodayCount },
    { data: salesRangeData },
    { data: salesMonthData },
    { count: cancelledTodayCount },
    { count: noShowTodayCount },
    { data: todayBarberBookingsData },
    { count: activeBarbersCount },
    { data: todayPaymentsData },
    { data: lowStockProductsData },
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
      .select("total_amount, paid_at, payment_method")
      .eq("payment_status", "paid")
      .gte("paid_at", rangeStartTimestamp)
      .lte("paid_at", monthEndTimestamp),
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
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", todayDate)
      .eq("status", "cancelled"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("booking_date", todayDate)
      .eq("status", "no_show"),
    supabase
      .from("bookings")
      .select("barber_id")
      .eq("booking_date", todayDate)
      .in("status", ["scheduled", "in_progress", "completed"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "barber")
      .eq("is_active", true),
    supabase
      .from("tickets")
      .select("total_amount, payment_method")
      .eq("payment_status", "paid")
      .gte("paid_at", todayStartTimestamp)
      .lte("paid_at", todayEndTimestamp),
    supabase
      .from("products")
      .select("id, name, stock_qty")
      .eq("is_active", true)
      .lte("stock_qty", 5)
      .order("stock_qty", { ascending: true })
      .limit(5),
  ]);

  const totalBookingsToday = bookingsCount ?? 0;
  const totalTicketsToday = ticketsTodayCount ?? 0;

  const salesTickets = (salesMonthData ?? []) as unknown as TicketRow[];
  const rangeTickets = (salesRangeData ?? []) as unknown as SalesSummaryRow[];
  const todayPayments = (todayPaymentsData ?? []) as TodayPaymentRow[];
  const todayBarberBookings = (todayBarberBookingsData ?? []) as TodayBarberBookingRow[];
  const lowStockProducts = (lowStockProductsData ?? []) as LowStockRow[];
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
    0,
  );
  const normalizePaymentMethod = (value: string | null) =>
    (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const cancelledToday = cancelledTodayCount ?? 0;
  const noShowToday = noShowTodayCount ?? 0;
  const activeBarbers = activeBarbersCount ?? 0;
  const bookedBarbersToday = new Set(
    todayBarberBookings.map((row) => row.barber_id).filter(Boolean),
  ).size;
  const barberUtilization = activeBarbers
    ? Math.round((bookedBarbersToday / activeBarbers) * 100)
    : 0;

  const todayCashSales = todayPayments
    .filter((ticket) => normalizePaymentMethod(ticket.payment_method) === "cash")
    .reduce((sum, ticket) => sum + (ticket.total_amount ?? 0), 0);
  const todayEwalletSales = todayPayments
    .filter((ticket) => normalizePaymentMethod(ticket.payment_method) === "ewallet")
    .reduce((sum, ticket) => sum + (ticket.total_amount ?? 0), 0);

  const rangeSummaryMap = new Map<
    string,
    {
      sales: number;
      totalTicket: number;
      totalCash: number;
      totalEwallet: number;
    }
  >();
  rangeTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const dateKey = getMalaysiaDateString(new Date(ticket.paid_at));
    const current = rangeSummaryMap.get(dateKey) ?? {
      sales: 0,
      totalTicket: 0,
      totalCash: 0,
      totalEwallet: 0,
    };
    const amount = ticket.total_amount ?? 0;
    const method = normalizePaymentMethod(ticket.payment_method);

    current.sales += amount;
    current.totalTicket += 1;
    if (method === "cash") {
      current.totalCash += amount;
    }
    if (method === "ewallet") {
      current.totalEwallet += amount;
    }

    rangeSummaryMap.set(dateKey, current);
  });
  const currentYearMonths = Array.from(
    { length: 12 },
    (_, index) => `${year}-${pad2(index + 1)}`,
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
        .filter(Boolean),
    ),
  ).sort();
  const dataYears = Array.from(
    new Set(dataMonths.map((value) => Number(value.split("-")[0]))),
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
          new Date(Date.UTC(monthYear, monthNumber - 1, day)),
        );
        const summary = rangeSummaryMap.get(dateKey) ?? {
          sales: 0,
          totalTicket: 0,
          totalCash: 0,
          totalEwallet: 0,
        };
        return {
          date: dateKey,
          sales: summary.sales,
          totalTicket: summary.totalTicket,
          totalCash: summary.totalCash,
          totalEwallet: summary.totalEwallet,
        };
      });
      return [monthValue, series];
    }),
  );

  const yearSalesMap = new Map<
    number,
    Map<
      string,
      {
        sales: number;
        totalTicket: number;
        totalCash: number;
        totalEwallet: number;
      }
    >
  >();
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
    const yearBucket =
      yearSalesMap.get(paidYear) ??
      new Map<
        string,
        {
          sales: number;
          totalTicket: number;
          totalCash: number;
          totalEwallet: number;
        }
      >();
    const current = yearBucket.get(monthKey) ?? {
      sales: 0,
      totalTicket: 0,
      totalCash: 0,
      totalEwallet: 0,
    };
    const amount = ticket.total_amount ?? 0;
    const method = normalizePaymentMethod(ticket.payment_method);

    current.sales += amount;
    current.totalTicket += 1;
    if (method === "cash") {
      current.totalCash += amount;
    }
    if (method === "ewallet") {
      current.totalEwallet += amount;
    }

    yearBucket.set(monthKey, current);
    yearSalesMap.set(paidYear, yearBucket);
  });
  const availableYears = Array.from(
    new Set(monthOptions.map((value) => Number(value.split("-")[0]))),
  ).filter(Boolean);
  const yearSeries = Object.fromEntries(
    availableYears.map((yearValue) => {
      const bucket =
        yearSalesMap.get(yearValue) ??
        new Map<
          string,
          {
            sales: number;
            totalTicket: number;
            totalCash: number;
            totalEwallet: number;
          }
        >();
      const series = Array.from({ length: 12 }, (_, index) => {
        const monthKey = `${yearValue}-${pad2(index + 1)}`;
        const summary = bucket.get(monthKey) ?? {
          sales: 0,
          totalTicket: 0,
          totalCash: 0,
          totalEwallet: 0,
        };
        return {
          date: monthKey,
          sales: summary.sales,
          totalTicket: summary.totalTicket,
          totalCash: summary.totalCash,
          totalEwallet: summary.totalEwallet,
        };
      });
      return [String(yearValue), series];
    }),
  );

  return (
    <>
      <div className="grid gap-4 px-5 lg:px-6 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                buttonVariants({ variant: action.featured ? "default" : "outline" }),
                "h-13 justify-center rounded-xl px-6 text-base font-semibold shadow-none",
                action.featured
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "border-border/80 bg-background text-foreground hover:bg-accent/40",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="leading-none">{action.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Total bookings
            </CardDescription>
            <CardTitle className="font-mono text-3xl text-foreground tabular-nums">
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
            <CardTitle className="font-mono text-3xl text-foreground tabular-nums">
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
            <CardTitle className="font-mono text-3xl text-foreground tabular-nums">
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
            <CardTitle className="font-mono text-3xl text-foreground tabular-nums">
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
          monthSeries={monthSeries}
          yearSeries={yearSeries}
          defaultMonth={defaultMonthOption}
          dataMonths={dataMonths}
          availableYears={availableYears}
          dataYears={dataYears}
        />
      </div>
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Booking outcomes today
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-foreground tabular-nums">
              {cancelledToday + noShowToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Cancelled: <span className="font-mono tabular-nums">{cancelledToday}</span>
            </p>
            <p>
              No-show: <span className="font-mono tabular-nums">{noShowToday}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Barber utilization today
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-foreground tabular-nums">
              {barberUtilization}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">
              {bookedBarbersToday}/{activeBarbers}
            </span>{" "}
            active barbers had bookings.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Payment split today
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-foreground tabular-nums">
              {formatCurrency(totalSalesToday)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Cash:{" "}
              <span className="font-mono tabular-nums">
                {formatCurrency(todayCashSales)}
              </span>
            </p>
            <p>
              E-wallet:{" "}
              <span className="font-mono tabular-nums">
                {formatCurrency(todayEwalletSales)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              Low stock alert
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-foreground tabular-nums">
              {lowStockProducts.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 2).map((product) => (
                <p key={product.id}>
                  {product.name ?? "Product"} (stock{" "}
                  <span className="font-mono tabular-nums">
                    {product.stock_qty ?? 0}
                  </span>
                  )
                </p>
              ))
            ) : (
              <p>No low stock items.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
