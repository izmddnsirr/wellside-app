import { AdminShell } from "./components/admin-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { BookingsChartCard } from "./components/bookings-chart-card";

export const metadata: Metadata = {
  title: "Wellside+ | Admin",
  description: "Wellside Barbershop booking and management system.",
};

const getMalaysiaDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

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
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");
  return { year, month, day };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

export default async function Page() {
  const supabase = await createAdminClient();
  const todayDate = getMalaysiaDateString();
  const { year, month } = getMalaysiaDateParts();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("booking_date", todayDate);

  const totalBookingsToday = count ?? 0;
  const { count: totalUsersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");
  const { count: totalBarbersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "barber");
  const { data: salesMonthData } = await supabase
    .from("bookings")
    .select(
      `
        booking_date,
        status,
        service:service_id (price)
      `
    )
    .gte("booking_date", monthStart)
    .lte("booking_date", monthEnd)
    .eq("status", "completed");

  const salesBookings = salesMonthData ?? [];
  const totalSalesToday = salesBookings.reduce((total, booking) => {
    if (booking.booking_date !== todayDate) {
      return total;
    }
    return total + (booking.service?.price ?? 0);
  }, 0);
  const totalSalesThisMonth = salesBookings.reduce(
    (total, booking) => total + (booking.service?.price ?? 0),
    0
  );
  const totalUsers = totalUsersCount ?? 0;
  const totalBarbers = totalBarbersCount ?? 0;

  return (
    <AdminShell
      title="Dashboard"
      description="Quick overview of today's performance."
    >
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-3">
        <Card className="border-slate-200/70 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/70">
          <CardHeader>
            <CardDescription className="text-slate-600">
              Total bookings
            </CardDescription>
            <CardTitle className="text-3xl text-slate-900">
              {totalBookingsToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Based on bookings for {todayDate}.
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/70">
          <CardHeader>
            <CardDescription className="text-slate-600">
              Total sales today
            </CardDescription>
            <CardTitle className="text-3xl text-slate-900">
              {formatCurrency(totalSalesToday)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Based on completed bookings today.
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/70">
          <CardHeader>
            <CardDescription className="text-slate-600">
              Total sales this month
            </CardDescription>
            <CardTitle className="text-3xl text-slate-900">
              {formatCurrency(totalSalesThisMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Based on completed bookings.
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <BookingsChartCard />
        <Card className="border-slate-200/70 bg-slate-50/60">
          <CardHeader>
            <CardTitle className="text-slate-900">Team & customers</CardTitle>
            <CardDescription className="text-slate-600">
              Active profiles in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-100/70 px-3 py-2">
              <span className="font-medium text-slate-900">Total users</span>
              <span className="text-slate-600">{totalUsers}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-100/70 px-3 py-2">
              <span className="font-medium text-slate-900">Total barbers</span>
              <span className="text-slate-600">{totalBarbers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
