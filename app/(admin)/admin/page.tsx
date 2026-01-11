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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

type TicketItemRow = {
  qty: number | null;
  services: { name: string | null; price: number | null } | null;
};

type TicketRow = {
  total_amount: number | null;
  paid_at: string | null;
  ticket_items: TicketItemRow[] | null;
};

export default async function Page() {
  const supabase = await createAdminClient();
  const todayDate = getMalaysiaTodayString();
  const { year, month } = getMalaysiaDateParts();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;
  const monthStartTimestamp = `${monthStart}T00:00:00+08:00`;
  const monthEndTimestamp = `${monthEnd}T23:59:59.999+08:00`;
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("booking_date", todayDate);

  const totalBookingsToday = count ?? 0;
  const { data: salesMonthData } = await supabase
    .from("tickets")
    .select(
      `
        total_amount,
        paid_at,
        ticket_items (
          qty,
          services:service_id (name, price)
        )
      `
    )
    .eq("payment_status", "paid")
    .gte("paid_at", monthStartTimestamp)
    .lte("paid_at", monthEndTimestamp);

  const salesTickets = (salesMonthData ?? []) as unknown as TicketRow[];
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

  const dailySalesMap = new Map<string, number>();
  salesTickets.forEach((ticket) => {
    if (!ticket.paid_at) {
      return;
    }
    const dateKey = getMalaysiaDateString(new Date(ticket.paid_at));
    dailySalesMap.set(
      dateKey,
      (dailySalesMap.get(dateKey) ?? 0) + (ticket.total_amount ?? 0)
    );
  });
  const salesChartData = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const dateKey = getMalaysiaDateString(new Date(Date.UTC(year, month - 1, day)));
    return {
      day: String(day).padStart(2, "0"),
      sales: dailySalesMap.get(dateKey) ?? 0,
    };
  });

  const serviceMap = new Map<string, { qty: number; revenue: number }>();
  salesTickets.forEach((ticket) => {
    ticket.ticket_items?.forEach((item) => {
      const name = item.services?.name?.trim();
      if (!name) {
        return;
      }
      const qty = item.qty ?? 0;
      const price = item.services?.price ?? 0;
      const current = serviceMap.get(name) ?? { qty: 0, revenue: 0 };
      serviceMap.set(name, {
        qty: current.qty + qty,
        revenue: current.revenue + qty * price,
      });
    });
  });
  const topServices = Array.from(serviceMap.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) =>
      b.qty === a.qty ? b.revenue - a.revenue : b.qty - a.qty
    )
    .slice(0, 4);

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
            Based on paid tickets today.
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
            Based on paid tickets this month.
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <BookingsChartCard data={salesChartData} />
        <Card className="border-slate-200/70 bg-slate-50/60">
          <CardHeader>
            <CardTitle className="text-slate-900">Top services</CardTitle>
            <CardDescription className="text-slate-600">
              Best selling services this month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {topServices.length === 0 ? (
              <p className="text-slate-600">No service sales yet.</p>
            ) : (
              topServices.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-100/70 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {service.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {service.qty} tickets
                    </p>
                  </div>
                  <span className="text-slate-600">
                    {formatCurrency(service.revenue)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
