"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  History,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";

export type BookingRow = {
  id: string;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  booking_date: string | null;
  created_at: string | null;
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
    base_price: number | null;
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
  view?: "tabs" | "active" | "past" | "calendar";
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

const getStatusTone = (status: string | null) => {
  switch (status) {
    case "scheduled":
      return { badge: "bg-blue-100 text-blue-900 border-blue-200", dot: "bg-blue-500" };
    case "in_progress":
      return { badge: "bg-amber-100 text-amber-900 border-amber-200", dot: "bg-amber-500" };
    case "completed":
      return { badge: "bg-emerald-100 text-emerald-900 border-emerald-200", dot: "bg-emerald-500" };
    case "no_show":
      return { badge: "bg-purple-100 text-purple-900 border-purple-200", dot: "bg-purple-500" };
    case "cancelled":
      return { badge: "bg-rose-100 text-rose-900 border-rose-200", dot: "bg-rose-500" };
    default:
      return { badge: "bg-muted text-foreground border-border", dot: "bg-muted-foreground" };
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
    case "no_show":
      return "border-purple-200 bg-purple-50 text-purple-900";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-border bg-background text-foreground";
  }
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const parseDateInput = (value: string) => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from) {
    return "Select a date range";
  }
  const formatter = new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  });
  const fromLabel = formatter.format(range.from);
  if (!range.to) {
    return `${fromLabel} →`;
  }
  return `${fromLabel} → ${formatter.format(range.to)}`;
};

const formatMonthValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (value: string) => {
  if (!value) {
    return "Pick month";
  }
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return "Pick month";
  }
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CALENDAR_SLOTS = [
  { label: "8:00 AM", show: true },
  { label: "8:30 AM", show: false },
  { label: "9:00 AM", show: true },
  { label: "9:30 AM", show: false },
  { label: "10:00 AM", show: true },
  { label: "10:30 AM", show: false },
  { label: "11:00 AM", show: true },
  { label: "11:30 AM", show: false },
  { label: "12:00 PM", show: true },
  { label: "12:30 PM", show: false },
  { label: "1:00 PM", show: true },
  { label: "1:30 PM", show: false },
  { label: "2:00 PM", show: true },
  { label: "2:30 PM", show: false },
];

const CALENDAR_BARBERS = [
  { id: "john", name: "John", initials: "JH", tone: "bg-sky-100 text-sky-900" },
  { id: "maria", name: "Maria", initials: "MR", tone: "bg-amber-100 text-amber-900" },
  { id: "wendy", name: "Wendy", initials: "WD", tone: "bg-rose-100 text-rose-900" },
  { id: "amy", name: "Amy", initials: "AM", tone: "bg-emerald-100 text-emerald-900" },
  { id: "michael", name: "Michael", initials: "ML", tone: "bg-orange-100 text-orange-900" },
  { id: "sarah", name: "Sarah", initials: "SS", tone: "bg-indigo-100 text-indigo-900" },
];

const CALENDAR_EVENTS = [
  {
    id: "evt-1",
    barberId: "john",
    start: 1,
    end: 3,
    time: "8:00 - 9:00",
    client: "Brenda Massey",
    service: "Blow dry",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    id: "evt-2",
    barberId: "john",
    start: 11,
    end: 14,
    time: "1:00 - 2:30",
    client: "Mary Lee Fisher",
    service: "Hair coloring",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    id: "evt-3",
    barberId: "maria",
    start: 1,
    end: 3,
    time: "8:00 - 9:00",
    client: "Alena Geidt",
    service: "Classic cut",
    tone: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    id: "evt-4",
    barberId: "maria",
    start: 5,
    end: 7,
    time: "10:00 - 10:45",
    client: "Marilyn Carder",
    service: "Hair + beard",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  {
    id: "evt-5",
    barberId: "wendy",
    start: 3,
    end: 6,
    time: "9:00 - 10:15",
    client: "Phillip Dorwart",
    service: "Beard grooming",
    tone: "bg-rose-100 text-rose-900 border-rose-200",
  },
  {
    id: "evt-6",
    barberId: "amy",
    start: 2,
    end: 5,
    time: "8:30 - 9:45",
    client: "James Herwitz",
    service: "Haircut",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  {
    id: "evt-7",
    barberId: "amy",
    start: 5,
    end: 8,
    time: "9:45 - 11:15",
    client: "Amy Jones",
    service: "Haircut + color",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    id: "evt-8",
    barberId: "michael",
    start: 3,
    end: 6,
    time: "9:00 - 10:15",
    client: "Megan White",
    service: "Fade cut",
    tone: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    id: "evt-9",
    barberId: "michael",
    start: 8,
    end: 10,
    time: "11:15 - 12:30",
    client: "Randy Press",
    service: "Scalp treatment",
    tone: "bg-rose-100 text-rose-900 border-rose-200",
  },
  {
    id: "evt-10",
    barberId: "sarah",
    start: 2,
    end: 5,
    time: "8:30 - 9:45",
    client: "Tony Danza",
    service: "Balayage",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  {
    id: "evt-11",
    barberId: "sarah",
    start: 5,
    end: 8,
    time: "9:45 - 11:15",
    client: "Laura Marsden",
    service: "Haircut + color",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    id: "evt-12",
    barberId: "sarah",
    start: 9,
    end: 11,
    time: "12:15 - 1:30",
    client: "Dori Doreau",
    service: "Haircut + color",
    tone: "bg-amber-100 text-amber-900 border-amber-200",
  },
];

export function BookingsCard({
  bookings,
  errorMessage,
  allowedStatuses,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  allowCancel = true,
  allowDelete = true,
  view = "tabs",
}: BookingsCardProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    date: "all",
    dateFrom: "",
    dateTo: "",
    month: "",
  });
  const [sort, setSort] = useState("created_desc");
  const [range, setRange] = useState<DateRange | undefined>();
  const [monthPickerYear, setMonthPickerYear] = useState(
    filters.month ? Number(filters.month.split("-")[0]) : new Date().getFullYear()
  );
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [statusSelections, setStatusSelections] = useState<Record<string, string>>({});
  const statusOptions = useMemo(
    () => allowedStatuses.filter((status) => status !== "cancelled"),
    [allowedStatuses]
  );
  const statusFilterOptions = useMemo(() => {
    const unique = new Set(allowedStatuses);
    unique.add("cancelled");
    return ["all", ...Array.from(unique)];
  }, [allowedStatuses]);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (filters.date !== "month" || filters.month) {
      return;
    }
    const now = new Date();
    const currentMonth = formatMonthValue(now);
    setFilters((prev) => ({ ...prev, month: currentMonth }));
    setMonthPickerYear(now.getFullYear());
  }, [filters.date, filters.month]);

  const filteredBookings = useMemo(() => {
    const customStart = parseDateInput(filters.dateFrom);
    const customEnd = parseDateInput(filters.dateTo);
    const isCustomRangeValid =
      customStart && customEnd && customStart <= customEnd;
    const monthParts = filters.month.split("-");
    const monthYear = Number(monthParts[0]);
    const monthValue = Number(monthParts[1]);
    const isMonthValid = monthYear && monthValue;
    const monthStart = isMonthValid
      ? startOfDay(new Date(monthYear, monthValue - 1, 1))
      : null;
    const monthEnd = isMonthValid
      ? endOfDay(new Date(monthYear, monthValue, 0))
      : null;

    const matchesSearch = (booking: BookingRow) => {
      if (!debouncedSearch) {
        return true;
      }
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
      return haystack.includes(debouncedSearch);
    };

    const matchesStatus = (booking: BookingRow) => {
      if (filters.status === "all") {
        return true;
      }
      const status = (booking.status ?? "").toLowerCase();
      return status === filters.status;
    };

    const matchesDate = (booking: BookingRow) => {
      const dateValue = booking.booking_date ?? booking.start_at;
      if (!dateValue) {
        return filters.date === "all";
      }
      const bookingDate = new Date(dateValue);
      if (filters.date === "all") {
        return true;
      }
      if (filters.date === "month" && monthStart && monthEnd) {
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }
      if (filters.date === "custom" && isCustomRangeValid) {
        return (
          bookingDate >= startOfDay(customStart) &&
          bookingDate <= endOfDay(customEnd)
        );
      }
      return true;
    };

    return bookings.filter(
      (booking) =>
        matchesSearch(booking) && matchesStatus(booking) && matchesDate(booking)
    );
  }, [bookings, debouncedSearch, filters]);

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const dateValueA = a.start_at ?? a.booking_date ?? "";
      const dateValueB = b.start_at ?? b.booking_date ?? "";
      const dateA = dateValueA ? new Date(dateValueA).getTime() : 0;
      const dateB = dateValueB ? new Date(dateValueB).getTime() : 0;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      const nameA = joinName(
        a.customer?.first_name ?? null,
        a.customer?.last_name ?? null
      );
      const nameB = joinName(
        b.customer?.first_name ?? null,
        b.customer?.last_name ?? null
      );

      if (sort === "date_desc") {
        const diff = dateB - dateA;
        return diff !== 0 ? diff : nameA.localeCompare(nameB);
      }
      if (sort === "date_asc") {
        const diff = dateA - dateB;
        return diff !== 0 ? diff : nameA.localeCompare(nameB);
      }
      if (sort === "customer_desc") {
        return nameB.localeCompare(nameA);
      }
      if (sort === "customer_asc") {
        return nameA.localeCompare(nameB);
      }
      if (sort === "created_desc") {
        const diff = createdB - createdA;
        return diff !== 0 ? diff : nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [filteredBookings, sort]);

  const upcomingBookings = sortedBookings.filter(
    (booking) =>
      booking.status !== "completed" &&
      booking.status !== "cancelled" &&
      booking.status !== "no_show"
  );
  const pastBookings = sortedBookings.filter(
    (booking) =>
      booking.status === "completed" ||
      booking.status === "cancelled" ||
      booking.status === "no_show"
  );
  const hasActiveFilters =
    Boolean(searchInput) ||
    filters.status !== "all" ||
    filters.date !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.month !== "" ||
    sort !== "created_desc";
  const noBookings = bookings.length === 0;

  const toolbar = (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All" : formatStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.date}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, date: value }))
            }
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Date scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bookings</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="custom">Date range</SelectItem>
            </SelectContent>
          </Select>
          {filters.date === "month" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 min-w-[180px] justify-between"
                  >
                    {formatMonthLabel(filters.month)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-3" align="start">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMonthPickerYear((prev) => prev - 1)}
                      aria-label="Previous year"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="text-sm font-semibold">
                      {monthPickerYear}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMonthPickerYear((prev) => prev + 1)}
                      aria-label="Next year"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {MONTH_LABELS.map((label, index) => {
                      const value = `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`;
                      const isActive = filters.month === value;
                      return (
                        <Button
                          key={label}
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              month: value,
                            }))
                          }
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    month: "",
                  }))
                }
                disabled={!filters.month}
              >
                Clear
              </Button>
            </div>
          ) : null}
          {filters.date === "custom" ? (
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 min-w-[200px] justify-between text-left"
                  >
                    {range?.from ? formatRangeLabel(range) : "Pick date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2" align="start">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={range}
                    onSelect={(value) => {
                      setRange(value);
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: value?.from ? formatDateInput(value.from) : "",
                        dateTo: value?.to ? formatDateInput(value.to) : "",
                      }));
                    }}
                    captionLayout="dropdown"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => {
                  setRange(undefined);
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: "",
                    dateTo: "",
                  }));
                }}
                disabled={!range?.from}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_asc">Date: Oldest → Newest</SelectItem>
              <SelectItem value="date_desc">Date: Newest → Oldest</SelectItem>
              <SelectItem value="customer_asc">Customer: A → Z</SelectItem>
              <SelectItem value="customer_desc">Customer: Z → A</SelectItem>
              <SelectItem value="created_desc">
                Created: Newest → Oldest
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="booking-search"
              placeholder="Search bookings"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({
                status: "all",
                date: "all",
                dateFrom: "",
                dateTo: "",
                month: "",
              });
              setSort("created_desc");
              setSearchInput("");
              setRange(undefined);
              setMonthPickerYear(new Date().getFullYear());
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      {filters.date === "month" && filters.month ? (
        <p className="text-xs text-muted-foreground">
          Showing bookings for {formatMonthLabel(filters.month)}
        </p>
      ) : null}
    </div>
  );

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  const activeDescription = "Upcoming and in-progress appointments.";
  const pastDescription = "Completed and cancelled bookings.";
  const activeEmptyTitle = debouncedSearch
    ? "No active bookings match your search"
    : noBookings
      ? "No bookings found yet"
      : "No active bookings right now";
  const activeEmptyDescription = debouncedSearch
    ? "Try a different name, service, or status."
    : noBookings
      ? "Bookings will appear here once customers start booking."
      : "Check past bookings for completed visits.";
  const pastEmptyTitle = debouncedSearch
    ? "No past bookings match your search"
    : "No completed or cancelled bookings yet";
  const pastEmptyDescription = debouncedSearch
    ? "Try a different name, service, or status."
    : "Completed bookings will show up here.";

  const calendarView = (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Calendar view</p>
          <p className="text-xs text-muted-foreground">
            Visual schedule preview for staff bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-400" />
            Haircut
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400" />
            Fade
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-400" />
            Treatment
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))] border-b border-border/60">
            <div className="px-2 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Time
            </div>
            {CALENDAR_BARBERS.map((barber) => (
              <div
                key={barber.id}
                className="flex items-center justify-center gap-2 px-3 py-3"
              >
                <Avatar className="size-8 ring-2 ring-background">
                  <AvatarFallback
                    className={`text-[11px] font-semibold ${barber.tone}`}
                  >
                    {barber.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{barber.name}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))]">
            <div className="border-r border-border/60">
              <div className="grid grid-rows-[repeat(14,36px)]">
                {CALENDAR_SLOTS.map((slot, index) => (
                  <div
                    key={`${slot.label}-${index}`}
                    className="border-b border-border/60 px-2 text-[11px] text-muted-foreground"
                  >
                    {slot.show ? slot.label : null}
                  </div>
                ))}
              </div>
            </div>
            {CALENDAR_BARBERS.map((barber) => (
              <div
                key={barber.id}
                className="relative border-r border-border/60 last:border-r-0"
              >
                <div className="grid grid-rows-[repeat(14,36px)]">
                  {CALENDAR_SLOTS.map((slot, index) => (
                    <div
                      key={`${barber.id}-${index}`}
                      className="border-b border-border/60"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-[repeat(14,36px)] px-3 py-2">
                  {CALENDAR_EVENTS.filter(
                    (event) => event.barberId === barber.id
                  ).map((event) => (
                    <div
                      key={event.id}
                      style={{ gridRow: `${event.start} / ${event.end}` }}
                      className={`flex flex-col justify-between rounded-xl border px-3 py-2 text-xs ${event.tone}`}
                    >
                      <span className="text-[11px] font-semibold">
                        {event.time}
                      </span>
                      <span className="text-sm font-semibold">
                        {event.client}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {event.service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const activeList =
    upcomingBookings.length === 0 ? (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
          <CalendarClock className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">{activeEmptyTitle}</p>
          <p className="text-sm text-muted-foreground">
            {activeEmptyDescription}
          </p>
        </div>
      </div>
    ) : (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Time
              </TableHead>
              <TableHead className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Service
              </TableHead>
              <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Barber
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingBookings.map((booking) => {
              const tone = getStatusTone(booking.status ?? null);
              return (
                <TableRow
                  key={booking.id}
                  className="bg-background hover:bg-muted/50"
                >
                  <TableCell className="w-[12%] px-4 py-3 text-muted-foreground">
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell className="w-[14%] px-4 py-3 font-semibold text-foreground">
                    {formatTimeRange(booking.start_at, booking.end_at)}
                  </TableCell>
                  <TableCell className="w-[22%] px-4 py-3 text-foreground">
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
                  <TableCell className="w-[18%] px-4 py-3 text-foreground">
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell className="w-[14%] px-4 py-3 text-foreground">
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null
                    )}
                  </TableCell>
                  <TableCell className="w-[10%] px-4 py-3">
                    <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                      <span className={`size-2 rounded-full ${tone.dot}`} />
                      {formatStatusLabel(booking.status ?? null)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[10%] px-4 py-3">
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
                                className={`gap-2 ${tone.badge} shrink-0`}
                              >
                                <span className={`size-2 rounded-full ${tone.dot}`} />
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
                                · {formatMoney(booking.service?.base_price ?? null)}
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
                                  <input type="hidden" name="id" value={booking.id} />
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    );

  const pastList =
    pastBookings.length === 0 ? (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-xl border border-border bg-background">
          <History className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">{pastEmptyTitle}</p>
          <p className="text-sm text-muted-foreground">
            {pastEmptyDescription}
          </p>
        </div>
      </div>
    ) : (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="w-[12%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Time
              </TableHead>
              <TableHead className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="w-[18%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Service
              </TableHead>
              <TableHead className="w-[14%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Barber
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastBookings.map((booking) => {
              const tone = getStatusTone(booking.status ?? null);
              return (
                <TableRow
                  key={booking.id}
                  className="bg-background hover:bg-muted/50"
                >
                  <TableCell className="w-[12%] px-4 py-3 text-muted-foreground">
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell className="w-[14%] px-4 py-3 font-semibold text-foreground">
                    {formatTimeRange(booking.start_at, booking.end_at)}
                  </TableCell>
                  <TableCell className="w-[22%] px-4 py-3 text-foreground">
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
                  <TableCell className="w-[18%] px-4 py-3 text-foreground">
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell className="w-[14%] px-4 py-3 text-foreground">
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null
                    )}
                  </TableCell>
                  <TableCell className="w-[10%] px-4 py-3">
                    <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                      <span className={`size-2 rounded-full ${tone.dot}`} />
                      {formatStatusLabel(booking.status ?? null)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[10%] px-4 py-3">
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    );

  if (view !== "tabs") {
    if (view === "calendar") {
      return (
        <div className="space-y-4">
          {toolbar}
          <p className="text-xs text-muted-foreground">
            Schedule overview by staff.
          </p>
          {calendarView}
        </div>
      );
    }

    const list = view === "past" ? pastList : activeList;

    return (
      <div className="space-y-4">
        {toolbar}
        {list}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toolbar}
      <Tabs defaultValue="active" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="active">Active bookings</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="past">Past bookings</TabsTrigger>
          </TabsList>
          {hasActiveFilters ? <Badge variant="secondary">Filtered</Badge> : null}
        </div>
        <TabsContent value="active" className="space-y-3">
          <p className="text-xs text-muted-foreground">{activeDescription}</p>
          {activeList}
        </TabsContent>
        <TabsContent value="calendar" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Schedule overview by staff.
          </p>
          {calendarView}
        </TabsContent>
        <TabsContent value="past" className="space-y-3">
          <p className="text-xs text-muted-foreground">{pastDescription}</p>
          {pastList}
        </TabsContent>
      </Tabs>
    </div>
  );
}
