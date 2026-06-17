import { BarberShell } from "./components/barber-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createBarberClient } from "@/utils/supabase/server";
import { CalendarX, Star, TrendingUp, CheckCircle } from "lucide-react";
import { WeeklyEarningsChart } from "./components/weekly-earnings-chart";

export const dynamic = "force-dynamic";

const getMalaysiaDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
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
  return timeFormatter
    .formatToParts(new Date(value))
    .map((part) =>
      part.type === "dayPeriod" ? part.value.toUpperCase() : part.value
    )
    .join("");
};

const formatStatusLabel = (status: string | null) => {
  if (!status) {
    return "Unknown";
  }
  return status
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};

type BookingCustomer = {
  first_name: string | null;
  last_name: string | null;
};

type BookingService = {
  name: string | null;
  base_price: number | null;
};

type BookingRelation<T> = T | T[] | null;

type BookingRow = {
  id: string;
  status: string;
  start_at: string;
  customer: BookingRelation<BookingCustomer>;
  service: BookingRelation<BookingService>;
};

const resolveSingle = <T,>(value: BookingRelation<T>) =>
  Array.isArray(value) ? value[0] ?? null : value;

export default async function Page() {
  const supabase = await createBarberClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const todayDate = getMalaysiaDateString();
  const barberId = user?.id ?? null;

  const { data: todaysBookingsData } = barberId
    ? await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          start_at,
          customer:customer_id (first_name, last_name),
          service:service_id (name, base_price)
        `
        )
        .eq("booking_date", todayDate)
        .eq("barber_id", barberId)
        .order("start_at", { ascending: true })
    : { data: [] };

  const now = new Date();
  const monthStart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .concat("-01");

  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weekStartDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(sevenDaysAgo);

  const [
    { data: monthlyBookingsData },
    { data: reviewData },
    { data: weeklyData },
  ] = barberId
    ? await Promise.all([
        supabase
          .from("bookings")
          .select("status,service:service_id (base_price)")
          .eq("barber_id", barberId)
          .gte("booking_date", monthStart),
        supabase
          .from("barber_reviews")
          .select("rating")
          .eq("barber_id", barberId),
        supabase
          .from("bookings")
          .select("booking_date,service:service_id (base_price)")
          .eq("barber_id", barberId)
          .eq("status", "completed")
          .gte("booking_date", weekStartDate)
          .order("booking_date", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const todaysBookings = (todaysBookingsData ?? []) as BookingRow[];
  const upcomingBookings = todaysBookings.filter(
    (booking) =>
      booking.status !== "completed" &&
      booking.status !== "cancelled" &&
      booking.status !== "no_show"
  );
  const totalBookingsToday = todaysBookings.length;
  const projectedEarnings = todaysBookings.reduce((total, booking) => {
    if (booking.status === "cancelled" || booking.status === "no_show") {
      return total;
    }
    const service = resolveSingle(booking.service);
    return total + Number(service?.base_price ?? 0);
  }, 0);

  const monthlyBookings = (monthlyBookingsData ?? []) as {
    status: string;
    service: BookingRelation<BookingService>;
  }[];
  const completedThisMonth = monthlyBookings.filter(
    (b) => b.status === "completed",
  );
  const resolvedThisMonth = monthlyBookings.filter((b) =>
    ["completed", "cancelled", "no_show"].includes(b.status),
  );
  const completionRate =
    resolvedThisMonth.length > 0
      ? Math.round((completedThisMonth.length / resolvedThisMonth.length) * 100)
      : 0;
  const monthEarnings = completedThisMonth.reduce((total, b) => {
    const service = resolveSingle(b.service);
    return total + Number(service?.base_price ?? 0);
  }, 0);

  const reviews = (reviewData ?? []) as { rating: number }[];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  type WeeklyRow = {
    booking_date: string;
    service: BookingRelation<BookingService>;
  };
  const weeklyRows = (weeklyData ?? []) as WeeklyRow[];
  const earningsByDate: Record<string, number> = {};
  for (const row of weeklyRows) {
    const date = row.booking_date;
    const service = resolveSingle(row.service);
    earningsByDate[date] =
      (earningsByDate[date] ?? 0) + Number(service?.base_price ?? 0);
  }
  const chartData: { date: string; earnings: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    chartData.push({ date: key, earnings: earningsByDate[key] ?? 0 });
  }

  return (
    <BarberShell title="Dashboard">
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Today&apos;s bookings</CardDescription>
            <CardTitle className="text-3xl">{totalBookingsToday}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on your schedule today.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Projected earnings</CardDescription>
            <CardTitle className="text-3xl">
              {new Intl.NumberFormat("en-MY", {
                style: "currency",
                currency: "MYR",
                maximumFractionDigits: 0,
              }).format(projectedEarnings)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on confirmed services.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Completion rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              {completionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This month&apos;s resolved bookings.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average rating</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              {avgRating ? avgRating.toFixed(1) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {reviews.length > 0
              ? `From ${reviews.length} review${reviews.length === 1 ? "" : "s"}.`
              : "No reviews yet."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>This month</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-sky-500" />
              {new Intl.NumberFormat("en-MY", {
                style: "currency",
                currency: "MYR",
                maximumFractionDigits: 0,
              }).format(monthEarnings)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Total earnings from completed bookings.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 px-4 lg:px-6">
        <WeeklyEarningsChart data={chartData} />
      </div>

      <div className="grid gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming schedule</CardTitle>
            <CardDescription>Today&apos;s confirmed appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/60">
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBookings.map((booking) => {
                      const customer = resolveSingle(booking.customer);
                      const service = resolveSingle(booking.service);

                      return (
                        <TableRow
                          key={booking.id}
                          className="bg-background hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {formatTime(booking.start_at)}
                          </TableCell>
                          <TableCell>
                            {[customer?.first_name, customer?.last_name]
                              .filter(Boolean)
                              .join(" ") || "-"}
                          </TableCell>
                          <TableCell>{service?.name ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
                <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                  <CalendarX className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    No upcoming bookings today
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New bookings will appear here once confirmed.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberShell>
  );
}
