"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { CalendarX, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type BookingRow = {
  id: string;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  booking_date: string | null;
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  barber: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  service: {
    name: string | null;
    duration_minutes: number | null;
    price: number | null;
  } | null;
};

type BookingsCardProps = {
  bookings: BookingRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<void>;
  cancelBooking?: (formData: FormData) => Promise<void>;
  deleteBooking?: (formData: FormData) => Promise<void>;
  allowCancel?: boolean;
  allowDelete?: boolean;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
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

  const parts = timeFormatter.formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod =
    parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const periodSuffix = dayPeriod ? ` ${dayPeriod.toUpperCase()}` : "";

  return `${hour}:${minute}${periodSuffix}`.trim();
};

const formatTimeRange = (start: string | null, end: string | null) => {
  if (!start || !end) {
    return "-";
  }
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
};

const joinName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ") || "-";

const formatStatusLabel = (status: string | null) => {
  if (!status) {
    return "Unknown";
  }
  return status
    .replace("_", " ")
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
};

const statusBadgeClass = (status: string | null) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-900 border-blue-200";
    case "in_progress":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "completed":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "cancelled":
      return "bg-rose-100 text-rose-900 border-rose-200";
    default:
      return "bg-muted text-foreground border-border";
  }
};

const statusSelectClass = (status: string | null) => {
  switch (status) {
    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-border bg-background text-foreground";
  }
};

export function BookingsCard({
  bookings,
  errorMessage,
  allowedStatuses,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  allowCancel = true,
  allowDelete = true,
}: BookingsCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [statusSelections, setStatusSelections] = useState<Record<string, string>>({});
  const statusOptions = useMemo(
    () => allowedStatuses.filter((status) => status !== "cancelled"),
    [allowedStatuses]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);
  const filteredBookings = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return bookings;
    }
    return bookings.filter((booking) => {
      const customerName = joinName(
        booking.customer?.first_name ?? null,
        booking.customer?.last_name ?? null
      );
      const barberName = joinName(
        booking.barber?.first_name ?? null,
        booking.barber?.last_name ?? null
      );
      const haystack = [
        booking.id,
        booking.status,
        customerName,
        booking.customer?.email,
        booking.customer?.phone,
        barberName,
        booking.service?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [bookings, query]);

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateA = a.booking_date ?? a.start_at ?? "";
      const dateB = b.booking_date ?? b.start_at ?? "";
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const timeA = a.start_at ?? "";
      const timeB = b.start_at ?? "";
      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }
      const nameA = joinName(
        a.customer?.first_name ?? null,
        a.customer?.last_name ?? null
      );
      const nameB = joinName(
        b.customer?.first_name ?? null,
        b.customer?.last_name ?? null
      );
      return nameA.localeCompare(nameB);
    });
  }, [filteredBookings]);

  const upcomingBookings = sortedBookings.filter(
    (booking) => booking.status !== "completed" && booking.status !== "cancelled"
  );
  const pastBookings = sortedBookings.filter(
    (booking) => booking.status === "completed" || booking.status === "cancelled"
  );

  if (errorMessage) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-red-600">
          {errorMessage}
        </CardContent>
      </Card>
    );
  }

  if (sortedBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active bookings</CardTitle>
          <CardDescription>
            Sorted by date, time, then customer name.
          </CardDescription>
          <CardAction>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="booking-search"
                placeholder="Search bookings"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-9"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
              <CalendarX className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {query
                  ? "No bookings match your search"
                  : "No bookings found yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {query
                  ? "Try a different name, service, or status."
                  : "Bookings will appear here once customers start booking."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active bookings</CardTitle>
          <CardDescription className="mt-1">
            Sorted by date, time, then customer name.
          </CardDescription>
          <CardAction>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="booking-search"
                placeholder="Search bookings"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-9"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                <CalendarX className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {query
                    ? "No active bookings match your search"
                    : "No active bookings right now"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {query
                    ? "Try a different name, service, or status."
                    : "Completed bookings are listed below."}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[12%]">Date</TableHead>
                  <TableHead className="w-[14%]">Time</TableHead>
                  <TableHead className="w-[22%]">Customer</TableHead>
                  <TableHead className="w-[18%]">Service</TableHead>
                  <TableHead className="w-[14%]">Barber</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="w-[12%]">
                      {formatDate(booking.booking_date ?? booking.start_at)}
                    </TableCell>
                    <TableCell className="w-[14%] font-medium">
                      {formatTimeRange(booking.start_at, booking.end_at)}
                    </TableCell>
                    <TableCell className="w-[22%]">
                      {joinName(
                        booking.customer?.first_name ?? null,
                        booking.customer?.last_name ?? null
                      )}
                      <div className="text-xs text-muted-foreground">
                        {booking.customer?.phone ||
                          booking.customer?.email ||
                          "-"}
                      </div>
                    </TableCell>
                    <TableCell className="w-[18%]">
                      {booking.service?.name ?? "-"}
                      <div className="text-xs text-muted-foreground">
                        {booking.service?.duration_minutes
                          ? `${booking.service.duration_minutes} min`
                          : "Duration not set"}{" "}
                        · {formatMoney(booking.service?.price ?? null)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[14%]">
                      {joinName(
                        booking.barber?.first_name ?? null,
                        booking.barber?.last_name ?? null
                      )}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(booking.status ?? null)}
                      >
                        {formatStatusLabel(booking.status ?? null)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[10%] text-right">
                      <Dialog
                        open={openDialogId === booking.id}
                        onOpenChange={(open) =>
                          setOpenDialogId(open ? booking.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenDialogId(booking.id)}
                          >
                            <Pencil />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage booking</DialogTitle>
                            <DialogDescription>
                              Update status or cancel this booking.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="w-full rounded-xl border border-border bg-muted/40 p-4">
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                              <div className="min-w-0">
                                <p className="text-lg font-semibold leading-tight">
                                  {joinName(
                                    booking.customer?.first_name ?? null,
                                    booking.customer?.last_name ?? null
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.customer?.phone ||
                                    booking.customer?.email ||
                                    "-"}
                                </p>
                              </div>
                              <div className="flex justify-start sm:justify-end">
                                <Badge
                                  variant="outline"
                                  className={`${statusBadgeClass(booking.status ?? null)} shrink-0`}
                                >
                                  {formatStatusLabel(booking.status ?? null)}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-medium">
                                  {formatDate(booking.booking_date ?? booking.start_at)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Time</p>
                                <p className="font-medium">
                                  {formatTimeRange(booking.start_at, booking.end_at)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Service</p>
                                <p className="font-medium">
                                  {booking.service?.name ?? "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.service?.duration_minutes
                                    ? `${booking.service.duration_minutes} min`
                                    : "Duration not set"}{" "}
                                  · {formatMoney(booking.service?.price ?? null)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Barber</p>
                                <p className="font-medium">
                                  {joinName(
                                    booking.barber?.first_name ?? null,
                                    booking.barber?.last_name ?? null
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                              <label
                                className="text-sm font-semibold"
                                htmlFor={`status-${booking.id}`}
                              >
                                Update status
                              </label>
                              <form
                                id={`update-booking-${booking.id}`}
                                action={updateBookingStatus}
                                className="contents"
                                onSubmit={() => setOpenDialogId(null)}
                              >
                                <input type="hidden" name="id" value={booking.id} />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={
                                    statusSelections[booking.id] ??
                                    booking.status ??
                                    "scheduled"
                                  }
                                />
                                <Select
                                  value={
                                    statusSelections[booking.id] ??
                                    booking.status ??
                                    "scheduled"
                                  }
                                  onValueChange={(value) =>
                                    setStatusSelections((prev) => ({
                                      ...prev,
                                      [booking.id]: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger
                                    id={`status-${booking.id}`}
                                    className={`${statusSelectClass(
                                      statusSelections[booking.id] ??
                                        booking.status ??
                                        "scheduled"
                                    )} w-full`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {formatStatusLabel(status)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </form>
                              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                <Button
                                  variant="outline"
                                  type="submit"
                                  form={`update-booking-${booking.id}`}
                                >
                                  Update status
                                </Button>
                                {allowCancel && cancelBooking ? (
                                  <form
                                    id={`cancel-booking-${booking.id}`}
                                    action={cancelBooking}
                                    onSubmit={() => setOpenDialogId(null)}
                                  >
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={booking.id}
                                    />
                                    <Button variant="destructive" type="submit">
                                      Cancel booking
                                    </Button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Past bookings</CardTitle>
          <CardDescription className="mt-1">
            Completed and cancelled bookings.
          </CardDescription>
          {query ? (
            <CardAction>
              <Badge variant="secondary">Filtered</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {pastBookings.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                <CalendarX className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  No completed or cancelled bookings yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed bookings will show up here.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[12%]">Date</TableHead>
                  <TableHead className="w-[14%]">Time</TableHead>
                  <TableHead className="w-[22%]">Customer</TableHead>
                  <TableHead className="w-[18%]">Service</TableHead>
                  <TableHead className="w-[14%]">Barber</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="w-[12%]">
                      {formatDate(booking.booking_date ?? booking.start_at)}
                    </TableCell>
                    <TableCell className="w-[14%] font-medium">
                      {formatTimeRange(booking.start_at, booking.end_at)}
                    </TableCell>
                    <TableCell className="w-[22%]">
                      {joinName(
                        booking.customer?.first_name ?? null,
                        booking.customer?.last_name ?? null
                      )}
                      <div className="text-xs text-muted-foreground">
                        {booking.customer?.phone ||
                          booking.customer?.email ||
                          "-"}
                      </div>
                    </TableCell>
                    <TableCell className="w-[18%]">
                      {booking.service?.name ?? "-"}
                      <div className="text-xs text-muted-foreground">
                        {booking.service?.duration_minutes
                          ? `${booking.service.duration_minutes} min`
                          : "Duration not set"}{" "}
                        · {formatMoney(booking.service?.price ?? null)}
                      </div>
                    </TableCell>
                    <TableCell className="w-[14%]">
                      {joinName(
                        booking.barber?.first_name ?? null,
                        booking.barber?.last_name ?? null
                      )}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(booking.status ?? null)}
                      >
                        {formatStatusLabel(booking.status ?? null)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[10%] text-right">
                      {allowDelete && deleteBooking ? (
                        <form action={deleteBooking}>
                          <input type="hidden" name="id" value={booking.id} />
                          <Button variant="destructive" size="sm" type="submit">
                            <Trash2 />
                            Delete
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
