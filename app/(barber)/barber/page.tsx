import { BarberShell } from "./components/barber-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CalendarX } from "lucide-react";

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
          service:service_id (name, price)
        `
        )
        .eq("booking_date", todayDate)
        .eq("barber_id", barberId)
        .order("start_at", { ascending: true })
    : { data: [] };

  const todaysBookings = todaysBookingsData ?? [];
  const upcomingBookings = todaysBookings.filter(
    (booking) =>
      booking.status !== "completed" && booking.status !== "cancelled"
  );
  const totalBookingsToday = todaysBookings.length;
  const projectedEarnings = todaysBookings.reduce((total, booking) => {
    if (booking.status === "cancelled") {
      return total;
    }
    return total + (booking.service?.price ?? 0);
  }, 0);

  return (
    <BarberShell
      title="Dashboard"
      description="Quick overview of today's performance."
    >
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Today's bookings</CardDescription>
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

      <div className="grid gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming schedule</CardTitle>
            <CardDescription>Today's confirmed appointments.</CardDescription>
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
                    {upcomingBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="bg-background hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {formatTime(booking.start_at)}
                        </TableCell>
                        <TableCell>
                          {[booking.customer?.first_name, booking.customer?.last_name]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </TableCell>
                        <TableCell>{booking.service?.name ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
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
