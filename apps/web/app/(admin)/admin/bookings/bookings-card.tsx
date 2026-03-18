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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CircleOff,
  ChevronLeft,
  ChevronRight,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import type {
  RestWindow,
  TemporaryClosure,
  WeeklySchedule,
} from "@/utils/shop-operations";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  evaluateShopDateStatus,
  hasRestWindowOverlap,
} from "@/utils/shop-operations";

export type BookingRow = {
  id: string;
  booking_ref: string;
  status: string;
  start_at: string;
  end_at: string;
  booking_date: string | null;
  created_at: string;
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  walk_in_customer: {
    name: string | null;
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

export type BarberUnavailabilityRow = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
};

export type BookingFormOption = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  working_start_time?: string | null;
  working_end_time?: string | null;
  off_days?: string[] | null;
};

export type ServiceFormOption = BookingFormOption & {
  durationMinutes: number | null;
};

type BookingMutationResult = {
  ok: boolean;
  error?: string;
};

type BookingsCardProps = {
  bookings: BookingRow[];
  unavailabilityEntries?: BarberUnavailabilityRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<BookingMutationResult>;
  cancelBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  deleteBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  createBooking?: (formData: FormData) => Promise<BookingMutationResult>;
  createBarberUnavailability?: (
    formData: FormData,
  ) => Promise<BookingMutationResult>;
  deleteBarberUnavailability?: (
    formData: FormData,
  ) => Promise<BookingMutationResult>;
  customerOptions?: BookingFormOption[];
  barberOptions?: BookingFormOption[];
  serviceOptions?: ServiceFormOption[];
  shopWeeklySchedule?: WeeklySchedule;
  shopTemporaryClosures?: TemporaryClosure[];
  shopRestWindows?: RestWindow[];
  allowCancel?: boolean;
  allowDelete?: boolean;
  showActions?: boolean;
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

const getBookingCustomerName = (booking: BookingRow) => {
  const existingName = joinName(
    booking.customer?.first_name ?? null,
    booking.customer?.last_name ?? null,
  );
  if (existingName !== "-") {
    return existingName;
  }
  return booking.walk_in_customer?.name?.trim() || "Walk-in";
};

const getBookingCustomerContact = (booking: BookingRow) =>
  booking.customer?.phone ||
  booking.customer?.email ||
  booking.walk_in_customer?.phone ||
  "-";

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
      return {
        badge:
          "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        dot: "bg-blue-500",
        calendarCard:
          "border-blue-200/90 bg-blue-50/80 text-blue-950 dark:border-blue-900/90 dark:bg-blue-950/40 dark:text-blue-100",
        calendarAccent: "border-l-blue-500 dark:border-l-blue-400",
      };
    case "in_progress":
      return {
        badge:
          "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        dot: "bg-amber-500",
        calendarCard:
          "border-amber-200/90 bg-amber-50/80 text-amber-950 dark:border-amber-900/90 dark:bg-amber-950/40 dark:text-amber-100",
        calendarAccent: "border-l-amber-500 dark:border-l-amber-400",
      };
    case "completed":
      return {
        badge:
          "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
        calendarCard:
          "border-emerald-200/90 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/90 dark:bg-emerald-950/40 dark:text-emerald-100",
        calendarAccent: "border-l-emerald-500 dark:border-l-emerald-400",
      };
    case "no_show":
      return {
        badge:
          "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        dot: "bg-purple-500",
        calendarCard:
          "border-purple-200/90 bg-purple-50/75 text-purple-950 dark:border-purple-900/90 dark:bg-purple-950/45 dark:text-purple-100",
        calendarAccent: "border-l-purple-500 dark:border-l-purple-400",
      };
    case "cancelled":
      return {
        badge:
          "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
        dot: "bg-rose-500",
        calendarCard:
          "border-rose-200/90 bg-rose-50/75 text-rose-950 dark:border-rose-900/90 dark:bg-rose-950/45 dark:text-rose-100",
        calendarAccent: "border-l-rose-500 dark:border-l-rose-400",
      };
    default:
      return {
        badge: "bg-muted text-foreground border-border",
        dot: "bg-muted-foreground",
        calendarCard: "border-border bg-muted/40 text-foreground",
        calendarAccent: "border-l-muted-foreground",
      };
  }
};

const statusSelectClass = (status: string | null) => {
  switch (status) {
    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "no_show":
      return "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300";
    default:
      return "border-border bg-background text-foreground";
  }
};

const bookingTableHeadClass =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const bookingTableHeadActionsClass =
  "px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const bookingTableCellClass = "px-4 py-3";
const bookingTableCellActionsClass = "px-4 py-3 text-right";
const bookingColumnClass = {
  date: "w-[12%]",
  time: "w-[14%]",
  customer: "w-[22%]",
  service: "w-[18%]",
  barber: "w-[14%]",
  status: "w-[10%]",
  actions: "w-[10%]",
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  const next = new Date(date);
  next.setDate(date.getDate() - diffToMonday);
  return startOfDay(next);
};

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

const CALENDAR_DEFAULT_START_MINUTES = 12 * 60;
const CALENDAR_DEFAULT_END_MINUTES = 22 * 60;
const CALENDAR_SLOT_MINUTES = 60;
const CALENDAR_ROW_HEIGHT = 72;
const CALENDAR_TIME_COLUMN_WIDTH = 88;

const CALENDAR_AVATAR_TONES = [
  "bg-sky-100 text-sky-900",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-900",
  "bg-emerald-100 text-emerald-900",
  "bg-orange-100 text-orange-900",
  "bg-indigo-100 text-indigo-900",
];

const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaDateLabelFormatter = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaWeekdayFormatter = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaDayFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaWeekdayKeyFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaHourMinuteFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kuala_Lumpur",
});

const toCalendarDateKey = (value: string | Date | null) => {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return malaysiaDateKeyFormatter.format(date);
};

const formatCalendarDateLabel = (value: Date) =>
  malaysiaDateLabelFormatter.format(value);

const toMinutesInMalaysia = (value: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = malaysiaHourMinuteFormatter.formatToParts(date);
  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? "NaN",
  );
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "NaN",
  );
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return hour * 60 + minute;
};

const toWeekdayKeyInMalaysia = (value: Date) => {
  const weekday = malaysiaWeekdayKeyFormatter.format(value).toLowerCase();
  return weekday;
};

const toInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

const toCalendarBarberId = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-") || "unassigned";

const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const parseTimeToMinutes = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
};

const formatMinutesToTimeLabel = (minutes: number) => {
  const normalizedMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;
  const hour12 = ((hour24 + 11) % 12) + 1;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const minuteLabel = String(minute).padStart(2, "0");
  return `${hour12}:${minuteLabel} ${suffix}`;
};

const normalizeCalendarEndMinutes = (
  startMinutes: number | null,
  endMinutes: number | null,
) => {
  if (endMinutes === null) {
    return null;
  }
  if (startMinutes !== null && endMinutes <= startMinutes) {
    return endMinutes + 24 * 60;
  }
  return endMinutes;
};

const formatWorkingHoursLabel = (
  startTime: string | null | undefined,
  endTime: string | null | undefined,
) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) {
    return "Working hour not set";
  }
  return `${formatMinutesToTimeLabel(startMinutes)} - ${formatMinutesToTimeLabel(endMinutes)}`;
};

const toIsoFromCalendarSlot = (calendarDateKey: string, minutes: number) => {
  const [yearRaw, monthRaw, dayRaw] = calendarDateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) {
    return null;
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcMillis = Date.UTC(year, month - 1, day, hour - 8, minute, 0, 0);
  return new Date(utcMillis).toISOString();
};

const formatIsoToDateField = (value: string) => toCalendarDateKey(value);

const formatIsoToTimeField = (value: string) => {
  const minutes = toMinutesInMalaysia(value);
  if (minutes === null) {
    return "";
  }
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
};

const formatMinutesToTimeField = (minutes: number) => {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minute = String(normalized % 60).padStart(2, "0");
  return `${hour}:${minute}`;
};

export function BookingsCard({
  bookings,
  unavailabilityEntries = [],
  errorMessage,
  allowedStatuses,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  createBooking,
  createBarberUnavailability,
  deleteBarberUnavailability,
  customerOptions = [],
  barberOptions = [],
  serviceOptions = [],
  shopWeeklySchedule = DEFAULT_WEEKLY_SCHEDULE,
  shopTemporaryClosures = [],
  shopRestWindows = [],
  allowCancel = true,
  allowDelete = true,
  showActions = true,
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
    filters.month
      ? Number(filters.month.split("-")[0])
      : new Date().getFullYear(),
  );
  const [calendarDate, setCalendarDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [calendarDialogBookingId, setCalendarDialogBookingId] = useState<
    string | null
  >(null);
  const [statusSelections, setStatusSelections] = useState<
    Record<string, string>
  >({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [unavailabilityDialogOpen, setUnavailabilityDialogOpen] =
    useState(false);
  const [createBookingDraft, setCreateBookingDraft] = useState<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    barberId: string;
    serviceId: string;
    bookingDate: string;
    bookingTime: string;
    notes: string;
  } | null>(null);
  const [unavailabilityDraft, setUnavailabilityDraft] = useState<{
    barberId: string;
    barberName: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  } | null>(null);
  const statusOptions = useMemo(
    () => allowedStatuses.filter((status) => status !== "cancelled"),
    [allowedStatuses],
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

  const handleDateFilterChange = (value: string) => {
    if (value === "month") {
      const now = new Date();
      const currentMonth = formatMonthValue(now);
      setFilters((prev) => ({
        ...prev,
        date: value,
        month: prev.month || currentMonth,
      }));
      setMonthPickerYear(now.getFullYear());
      return;
    }

    setFilters((prev) => ({
      ...prev,
      date: value,
      month: value === "month" ? prev.month : "",
    }));
  };

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
      const customerName = getBookingCustomerName(booking);
      const barberName = joinName(
        booking.barber?.first_name ?? null,
        booking.barber?.last_name ?? null,
      );
      const haystack = [
        booking.id,
        booking.booking_ref,
        booking.status,
        customerName,
        booking.customer?.email,
        booking.customer?.phone,
        booking.walk_in_customer?.name,
        booking.walk_in_customer?.phone,
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
        matchesSearch(booking) &&
        matchesStatus(booking) &&
        matchesDate(booking),
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
      const nameA = getBookingCustomerName(a);
      const nameB = getBookingCustomerName(b);

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
      booking.status !== "no_show",
  );
  const pastBookings = sortedBookings.filter(
    (booking) =>
      booking.status === "completed" ||
      booking.status === "cancelled" ||
      booking.status === "no_show",
  );

  const calendarDateKey = useMemo(
    () => toCalendarDateKey(calendarDate),
    [calendarDate],
  );
  const todayKey = useMemo(() => toCalendarDateKey(new Date()), []);

  const calendarWeekDays = useMemo(() => {
    const weekStart = startOfWeek(calendarDate);
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(weekStart);
      value.setDate(weekStart.getDate() + index);
      return startOfDay(value);
    });
  }, [calendarDate]);
  const calendarWeekShopStatus = useMemo(
    () =>
      calendarWeekDays.reduce<
        Record<string, ReturnType<typeof evaluateShopDateStatus>>
      >((acc, day) => {
        const dateKey = toCalendarDateKey(day);
        acc[dateKey] = evaluateShopDateStatus(
          dateKey,
          shopWeeklySchedule,
          shopTemporaryClosures,
        );
        return acc;
      }, {}),
    [calendarWeekDays, shopTemporaryClosures, shopWeeklySchedule],
  );

  const calendarWeekLabel = useMemo(() => {
    const start = calendarWeekDays[0];
    const end = calendarWeekDays[calendarWeekDays.length - 1];
    if (!start || !end) {
      return "";
    }
    return `${formatCalendarDateLabel(start)} - ${formatCalendarDateLabel(end)}`;
  }, [calendarWeekDays]);

  const calendarWeekRange = useMemo(() => {
    const start = calendarWeekDays[0];
    const end = calendarWeekDays[calendarWeekDays.length - 1];
    if (!start || !end) {
      return null;
    }
    return {
      from: startOfDay(start),
      to: endOfDay(end),
    };
  }, [calendarWeekDays]);

  const calendarWeekBookings = useMemo(() => {
    if (!calendarWeekRange) {
      return [];
    }
    return filteredBookings.filter((booking) => {
      const dateValue = booking.booking_date ?? booking.start_at;
      if (!dateValue) {
        return false;
      }
      const bookingDate = new Date(dateValue);
      return (
        bookingDate >= calendarWeekRange.from &&
        bookingDate <= calendarWeekRange.to
      );
    });
  }, [calendarWeekRange, filteredBookings]);

  const calendarBarbers = useMemo(() => {
    if (barberOptions.length > 0) {
      return barberOptions.map((barberOption, index) => ({
        id: barberOption.id,
        name: barberOption.name,
        initials: toInitials(barberOption.name),
        workingHoursLabel: formatWorkingHoursLabel(
          barberOption.working_start_time,
          barberOption.working_end_time,
        ),
        tone: CALENDAR_AVATAR_TONES[index % CALENDAR_AVATAR_TONES.length],
      }));
    }

    const source =
      calendarWeekBookings.length > 0
        ? calendarWeekBookings
        : filteredBookings.length > 0
          ? filteredBookings
          : bookings;
    const seen = new Set<string>();
    const output: Array<{
      id: string;
      name: string;
      initials: string;
      workingHoursLabel: string;
      tone: string;
    }> = [];

    source.forEach((booking, index) => {
      const name = joinName(
        booking.barber?.first_name ?? null,
        booking.barber?.last_name ?? null,
      );
      if (seen.has(name)) {
        return;
      }
      seen.add(name);
      output.push({
        id: toCalendarBarberId(name),
        name,
        initials: toInitials(name),
        workingHoursLabel: "Working hour not set",
        tone: CALENDAR_AVATAR_TONES[index % CALENDAR_AVATAR_TONES.length],
      });
    });

    return output;
  }, [barberOptions, bookings, calendarWeekBookings, filteredBookings]);

  const workingHoursByBarberId = useMemo(() => {
    return new Map(
      barberOptions.map((barberOption) => {
        const start = parseTimeToMinutes(barberOption.working_start_time);
        const end = normalizeCalendarEndMinutes(
          start,
          parseTimeToMinutes(barberOption.working_end_time),
        );
        return [
          barberOption.id,
          {
            start,
            end,
            offDays: new Set(
              (barberOption.off_days ?? []).map((value) =>
                String(value).toLowerCase(),
              ),
            ),
          },
        ] as const;
      }),
    );
  }, [barberOptions]);

  const calendarVisibleRange = useMemo(() => {
    const selectedDayBookings = calendarWeekBookings.filter((booking) => {
      const dateValue = booking.start_at ?? booking.booking_date;
      return toCalendarDateKey(dateValue) === calendarDateKey;
    });

    const rangeStarts: number[] = [];
    const rangeEnds: number[] = [];

    workingHoursByBarberId.forEach((workingHours) => {
      if (workingHours.start !== null) {
        rangeStarts.push(workingHours.start);
      }
      if (workingHours.end !== null) {
        rangeEnds.push(workingHours.end);
      }
    });

    selectedDayBookings.forEach((booking) => {
      const startMinutes = toMinutesInMalaysia(booking.start_at);
      const endMinutes = normalizeCalendarEndMinutes(
        startMinutes,
        toMinutesInMalaysia(booking.end_at ?? booking.start_at),
      );

      if (startMinutes !== null) {
        rangeStarts.push(startMinutes);
      }
      if (endMinutes !== null) {
        rangeEnds.push(endMinutes);
      }
    });

    const rawStart =
      rangeStarts.length > 0
        ? Math.min(...rangeStarts)
        : CALENDAR_DEFAULT_START_MINUTES;
    const rawEnd =
      rangeEnds.length > 0
        ? Math.max(...rangeEnds)
        : CALENDAR_DEFAULT_END_MINUTES;

    const startMinutes =
      Math.floor(rawStart / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_MINUTES;
    const endMinutes = Math.max(
      startMinutes + CALENDAR_SLOT_MINUTES,
      Math.ceil(rawEnd / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_MINUTES,
    );

    return { startMinutes, endMinutes };
  }, [calendarDateKey, calendarWeekBookings, workingHoursByBarberId]);

  const calendarSlots = useMemo(() => {
    const slotCount =
      (calendarVisibleRange.endMinutes - calendarVisibleRange.startMinutes) /
      CALENDAR_SLOT_MINUTES;
    return Array.from({ length: slotCount }, (_, index) => {
      return {
        label: formatMinutesToTimeLabel(
          calendarVisibleRange.startMinutes + index * CALENDAR_SLOT_MINUTES,
        ),
        show: true,
      };
    });
  }, [calendarVisibleRange]);

  const calendarEvents = useMemo(() => {
    const barberIdByName = new Map(
      calendarBarbers.map((barber) => [normalizeName(barber.name), barber.id]),
    );

    return calendarWeekBookings
      .filter((booking) => {
        const dateValue = booking.start_at ?? booking.booking_date;
        return toCalendarDateKey(dateValue) === calendarDateKey;
      })
      .map((booking) => {
        const barberName = joinName(
          booking.barber?.first_name ?? null,
          booking.barber?.last_name ?? null,
        );
        const barberId =
          barberIdByName.get(normalizeName(barberName)) ??
          toCalendarBarberId(barberName);

        const startMinutes = toMinutesInMalaysia(booking.start_at);
        const endMinutes = normalizeCalendarEndMinutes(
          startMinutes,
          toMinutesInMalaysia(booking.end_at ?? booking.start_at),
        );

        const safeStart =
          startMinutes === null
            ? calendarVisibleRange.startMinutes
            : startMinutes;
        const safeEnd =
          endMinutes === null
            ? safeStart + CALENDAR_SLOT_MINUTES
            : Math.max(endMinutes, safeStart + CALENDAR_SLOT_MINUTES);

        const clampedStart = Math.max(
          calendarVisibleRange.startMinutes,
          safeStart,
        );
        const clampedEnd = Math.min(calendarVisibleRange.endMinutes, safeEnd);

        const startRow =
          Math.floor(
            (clampedStart - calendarVisibleRange.startMinutes) /
              CALENDAR_SLOT_MINUTES,
          ) + 1;
        const endRow = Math.max(
          startRow + 1,
          Math.ceil(
            (clampedEnd - calendarVisibleRange.startMinutes) /
              CALENDAR_SLOT_MINUTES,
          ) + 1,
        );

        const tone = getStatusTone(booking.status ?? null);

        return {
          id: booking.id,
          barberId,
          startRow,
          endRow,
          time: formatTime(booking.start_at),
          client: getBookingCustomerName(booking),
          service: booking.service?.name ?? "-",
          status: formatStatusLabel(booking.status ?? null),
          statusTone: tone.badge,
          cardTone: tone.calendarCard,
          accentTone: tone.calendarAccent,
        };
      });
  }, [
    calendarBarbers,
    calendarDateKey,
    calendarVisibleRange,
    calendarWeekBookings,
  ]);

  const calendarUnavailabilityEvents = useMemo(() => {
    return unavailabilityEntries.reduce<
      Array<{
        id: string;
        barberId: string;
        startRow: number;
        endRow: number;
        reason: string | null;
      }>
    >((output, entry) => {
      if (
        !entry.barber_id ||
        toCalendarDateKey(entry.start_at) !== calendarDateKey
      ) {
        return output;
      }

      const startMinutes = toMinutesInMalaysia(entry.start_at);
      const endMinutes = normalizeCalendarEndMinutes(
        startMinutes,
        toMinutesInMalaysia(entry.end_at),
      );

      const safeStart =
        startMinutes === null
          ? calendarVisibleRange.startMinutes
          : startMinutes;
      const safeEnd =
        endMinutes === null
          ? safeStart + CALENDAR_SLOT_MINUTES
          : Math.max(endMinutes, safeStart + CALENDAR_SLOT_MINUTES);

      const clampedStart = Math.max(
        calendarVisibleRange.startMinutes,
        safeStart,
      );
      const clampedEnd = Math.min(calendarVisibleRange.endMinutes, safeEnd);
      if (clampedEnd <= clampedStart) {
        return output;
      }

      const startRow =
        Math.floor(
          (clampedStart - calendarVisibleRange.startMinutes) /
            CALENDAR_SLOT_MINUTES,
        ) + 1;
      const endRow = Math.max(
        startRow + 1,
        Math.ceil(
          (clampedEnd - calendarVisibleRange.startMinutes) /
            CALENDAR_SLOT_MINUTES,
        ) + 1,
      );

      output.push({
        id: entry.id,
        barberId: entry.barber_id,
        startRow,
        endRow,
        reason: entry.reason,
      });
      return output;
    }, []);
  }, [calendarDateKey, calendarVisibleRange, unavailabilityEntries]);

  const canCreateFromCalendar =
    Boolean(createBooking) &&
    customerOptions.length > 0 &&
    barberOptions.length > 0 &&
    serviceOptions.length > 0;

  const createBookingTiming = useMemo(() => {
    if (!createBookingDraft) {
      return {
        startAt: "",
        endAt: "",
      };
    }

    const startMinutes = parseTimeToMinutes(createBookingDraft.bookingTime);

    if (!createBookingDraft.bookingDate || startMinutes === null) {
      return {
        startAt: "",
        endAt: "",
      };
    }

    return {
      startAt:
        toIsoFromCalendarSlot(createBookingDraft.bookingDate, startMinutes) ??
        "",
      endAt:
        toIsoFromCalendarSlot(
          createBookingDraft.bookingDate,
          startMinutes + CALENDAR_SLOT_MINUTES,
        ) ?? "",
    };
  }, [createBookingDraft]);

  const unavailabilityTiming = useMemo(() => {
    if (!unavailabilityDraft) {
      return {
        startAt: "",
        endAt: "",
      };
    }

    const startMinutes = parseTimeToMinutes(unavailabilityDraft.startTime);
    const endMinutes = parseTimeToMinutes(unavailabilityDraft.endTime);

    if (
      !unavailabilityDraft.date ||
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      return {
        startAt: "",
        endAt: "",
      };
    }

    return {
      startAt:
        toIsoFromCalendarSlot(unavailabilityDraft.date, startMinutes) ?? "",
      endAt: toIsoFromCalendarSlot(unavailabilityDraft.date, endMinutes) ?? "",
    };
  }, [unavailabilityDraft]);

  const calendarDateShopStatus = useMemo(
    () =>
      evaluateShopDateStatus(
        calendarDateKey,
        shopWeeklySchedule,
        shopTemporaryClosures,
      ),
    [calendarDateKey, shopTemporaryClosures, shopWeeklySchedule],
  );

  const canCreateInSlot = (barberId: string, slotIndex: number) => {
    if (!canCreateFromCalendar) {
      return false;
    }
    if (calendarDateShopStatus.closed) {
      return false;
    }
    const workingHours = workingHoursByBarberId.get(barberId);
    if (
      !workingHours ||
      workingHours.start === null ||
      workingHours.end === null
    ) {
      return false;
    }
    const weekdayKey = toWeekdayKeyInMalaysia(calendarDate);
    if (workingHours.offDays.has(weekdayKey)) {
      return false;
    }

    const slotStart =
      calendarVisibleRange.startMinutes + slotIndex * CALENDAR_SLOT_MINUTES;
    const slotEnd = slotStart + CALENDAR_SLOT_MINUTES;
    if (!(slotStart >= workingHours.start && slotEnd <= workingHours.end)) {
      return false;
    }

    const slotDateKey = toCalendarDateKey(calendarDate);
    const slotStartISO = toIsoFromCalendarSlot(slotDateKey, slotStart);
    const slotEndISO = toIsoFromCalendarSlot(slotDateKey, slotEnd);
    if (
      !slotStartISO ||
      !slotEndISO ||
      hasRestWindowOverlap(slotStartISO, slotEndISO, shopRestWindows)
    ) {
      return false;
    }

    const hasBlockedRange = calendarUnavailabilityEvents.some((entry) => {
      if (entry.barberId !== barberId) {
        return false;
      }
      const blockedStart =
        calendarVisibleRange.startMinutes +
        (entry.startRow - 1) * CALENDAR_SLOT_MINUTES;
      const blockedEnd =
        calendarVisibleRange.startMinutes +
        (entry.endRow - 1) * CALENDAR_SLOT_MINUTES;
      return slotStart < blockedEnd && blockedStart < slotEnd;
    });

    return !hasBlockedRange;
  };
  const calendarDialogBooking = useMemo(
    () =>
      calendarWeekBookings.find(
        (booking) => booking.id === calendarDialogBookingId,
      ) ?? null,
    [calendarDialogBookingId, calendarWeekBookings],
  );

  const openCreateBookingDialog = (
    barberId: string,
    barberName: string,
    slotIndex: number,
  ) => {
    if (!canCreateFromCalendar) {
      return;
    }
    if (!canCreateInSlot(barberId, slotIndex)) {
      return;
    }
    const dateKey = toCalendarDateKey(calendarDate);
    if (!dateKey) {
      return;
    }

    const startMinutes =
      calendarVisibleRange.startMinutes + slotIndex * CALENDAR_SLOT_MINUTES;
    const endMinutes = startMinutes + CALENDAR_SLOT_MINUTES;
    const startAt = toIsoFromCalendarSlot(dateKey, startMinutes);
    const endAt = toIsoFromCalendarSlot(dateKey, endMinutes);

    if (!startAt || !endAt) {
      return;
    }

    const preferredBarber =
      barberOptions.find((barberOption) => barberOption.id === barberId) ??
      barberOptions.find(
        (barberOption) =>
          normalizeName(barberOption.name) === normalizeName(barberName),
      ) ??
      barberOptions[0];

    setCreateBookingDraft({
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      barberId: preferredBarber?.id ?? barberOptions[0]?.id ?? "",
      serviceId: "",
      bookingDate: formatIsoToDateField(startAt),
      bookingTime: formatIsoToTimeField(startAt),
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const openUnavailabilityDialog = (
    barberId: string,
    barberName: string,
    slotIndex: number,
  ) => {
    if (!canCreateInSlot(barberId, slotIndex)) {
      return;
    }

    const dateKey = toCalendarDateKey(calendarDate);
    if (!dateKey) {
      return;
    }

    const startMinutes =
      calendarVisibleRange.startMinutes + slotIndex * CALENDAR_SLOT_MINUTES;
    const endMinutes = startMinutes + CALENDAR_SLOT_MINUTES;

    setUnavailabilityDraft({
      barberId,
      barberName,
      date: dateKey,
      startTime: formatMinutesToTimeField(startMinutes),
      endTime: formatMinutesToTimeField(endMinutes),
      reason: "",
    });
    setUnavailabilityDialogOpen(true);
  };

  const runBookingMutation = async (
    mutation: (formData: FormData) => Promise<BookingMutationResult>,
    formData: FormData,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    try {
      const result = await mutation(formData);
      if (!result?.ok) {
        toast.error(result?.error ?? "Action failed. Please try again.");
        return;
      }

      onSuccess?.();
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      console.error("Booking mutation failed", error);
      toast.error("Action failed. Please try again.");
    }
  };

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
            <SelectTrigger className="h-9 w-40">
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
          <Select value={filters.date} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="h-9 w-40">
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
                    className="h-9 min-w-45 justify-between"
                  >
                    {formatMonthLabel(filters.month)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-65 p-3" align="start">
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
                    className="h-9 min-w-50 justify-between text-left"
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
                        dateFrom: value?.from
                          ? formatDateInput(value.from)
                          : "",
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
          {view !== "calendar" ? (
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-50">
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
          ) : null}
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

  const calendarWeekSelector = (
    <div className="px-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-xl px-5"
          onClick={() => {
            const previousWeek = new Date(calendarDate);
            previousWeek.setDate(previousWeek.getDate() - 7);
            setCalendarDate(startOfWeek(previousWeek));
          }}
        >
          <ChevronLeft className="size-4" />
          Prev week
        </Button>
        <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4">
          {calendarWeekDays.map((day) => {
            const dayKey = toCalendarDateKey(day);
            const isActive = dayKey === calendarDateKey;
            const dayStatus = calendarWeekShopStatus[dayKey];
            const isClosed = Boolean(dayStatus?.closed);
            const isToday = dayKey === todayKey;
            return (
              <div key={dayKey} className="flex flex-col items-center gap-2">
                <Button
                  variant={isActive && !isClosed ? "default" : "outline"}
                  className={`h-19 w-19 rounded-full border-border/70 p-0 shadow-sm ${
                    isClosed
                      ? "border-border/50 bg-muted/60 text-muted-foreground"
                      : ""
                  }`}
                  onClick={() => setCalendarDate(startOfDay(day))}
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span className="text-[11px] uppercase tracking-normal">
                      {malaysiaWeekdayFormatter.format(day)}
                    </span>
                    <span className="text-2xl font-semibold">
                      {malaysiaDayFormatter.format(day)}
                    </span>
                  </span>
                </Button>
                <span className="min-h-4 text-xs text-muted-foreground">
                  {isToday ? "Today" : isClosed ? "Closed" : ""}
                </span>
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-xl px-5"
          onClick={() => {
            const nextWeek = new Date(calendarDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            setCalendarDate(startOfWeek(nextWeek));
          }}
        >
          Next week
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );

  const createBookingDialog =
    canCreateFromCalendar && createBooking && createBookingDraft ? (
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateBookingDraft(null);
          }
        }}
      >
        <DialogContent className="p-4 sm:max-w-140 sm:p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl">Add Booking</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new manual booking
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (formData) => {
              if (!createBooking) {
                return;
              }
              await runBookingMutation(
                createBooking,
                formData,
                "Booking created.",
                () => {
                  setCreateDialogOpen(false);
                  setCreateBookingDraft(null);
                },
              );
            }}
            className="space-y-3"
          >
            <input
              type="hidden"
              name="start_at"
              value={createBookingTiming.startAt}
            />
            <input
              type="hidden"
              name="end_at"
              value={createBookingTiming.endAt}
            />
            <input
              type="hidden"
              name="customer_id"
              value={createBookingDraft.customerId}
            />
            <input
              type="hidden"
              name="customer_name"
              value={createBookingDraft.customerName}
            />
            <input
              type="hidden"
              name="customer_phone"
              value={createBookingDraft.customerPhone}
            />
            <input
              type="hidden"
              name="customer_email"
              value={createBookingDraft.customerEmail}
            />
            <input
              type="hidden"
              name="barber_id"
              value={createBookingDraft.barberId}
            />
            <input
              type="hidden"
              name="service_id"
              value={createBookingDraft.serviceId}
            />

            <div className="space-y-2">
              <label
                htmlFor="create-booking-customer-name"
                className="text-xs font-medium"
              >
                Customer Name *
              </label>
              <Input
                id="create-booking-customer-name"
                list="create-booking-customers"
                value={createBookingDraft.customerName}
                placeholder="Enter customer name"
                className="h-9"
                onChange={(event) => {
                  const nextName = event.target.value;
                  const matchedCustomer =
                    customerOptions.find(
                      (customer) =>
                        normalizeName(customer.name) ===
                        normalizeName(nextName),
                    ) ?? null;

                  setCreateBookingDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          customerName: nextName,
                          customerId: matchedCustomer?.id ?? "",
                          customerPhone: matchedCustomer?.phone ?? "",
                          customerEmail: matchedCustomer?.email ?? "",
                        }
                      : prev,
                  );
                }}
                required
              />
              <datalist id="create-booking-customers">
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.name} />
                ))}
              </datalist>
              {!createBookingDraft.customerId ? (
                <p className="text-[11px] text-muted-foreground">
                  Select existing customer or enter walk-in name and phone.
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="create-booking-customer-phone"
                  className="text-xs font-medium"
                >
                  Phone *
                </label>
                <Input
                  id="create-booking-customer-phone"
                  value={createBookingDraft.customerPhone}
                  placeholder="Enter phone number"
                  className="h-9"
                  onChange={(event) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            customerPhone: event.target.value,
                          }
                        : prev,
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="create-booking-customer-email"
                  className="text-xs font-medium"
                >
                  Email
                </label>
                <Input
                  id="create-booking-customer-email"
                  value={createBookingDraft.customerEmail}
                  placeholder="Enter email (optional)"
                  className="h-9"
                  onChange={(event) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            customerEmail: event.target.value,
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium">Staff *</label>
                <Select
                  value={createBookingDraft.barberId}
                  onValueChange={(value) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            barberId: value,
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select barber" />
                  </SelectTrigger>
                  <SelectContent>
                    {barberOptions.map((barberOption) => (
                      <SelectItem key={barberOption.id} value={barberOption.id}>
                        {barberOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Services *</label>
                <Select
                  value={createBookingDraft.serviceId}
                  onValueChange={(value) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            serviceId: value,
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((serviceOption) => (
                      <SelectItem
                        key={serviceOption.id}
                        value={serviceOption.id}
                      >
                        {serviceOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="create-booking-date"
                  className="text-xs font-medium"
                >
                  Date *
                </label>
                <Input
                  id="create-booking-date"
                  type="date"
                  value={createBookingDraft.bookingDate}
                  onChange={(event) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            bookingDate: event.target.value,
                          }
                        : prev,
                    )
                  }
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="create-booking-time"
                  className="text-xs font-medium"
                >
                  Time *
                </label>
                <Input
                  id="create-booking-time"
                  type="time"
                  value={createBookingDraft.bookingTime}
                  className="h-9"
                  onChange={(event) =>
                    setCreateBookingDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            bookingTime: event.target.value,
                          }
                        : prev,
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="create-booking-notes"
                className="text-xs font-medium"
              >
                Notes
              </label>
              <textarea
                id="create-booking-notes"
                value={createBookingDraft.notes}
                placeholder="Internal notes (optional)"
                onChange={(event) =>
                  setCreateBookingDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          notes: event.target.value,
                        }
                      : prev,
                  )
                }
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateBookingDraft(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  !(
                    createBookingDraft.customerId ||
                    (createBookingDraft.customerName &&
                      createBookingDraft.customerPhone)
                  ) ||
                  !createBookingDraft.barberId ||
                  !createBookingDraft.serviceId ||
                  !createBookingTiming.startAt ||
                  !createBookingTiming.endAt
                }
              >
                Create Booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    ) : null;

  const unavailabilityDialog = unavailabilityDraft ? (
    <Dialog
      open={unavailabilityDialogOpen}
      onOpenChange={(open) => {
        setUnavailabilityDialogOpen(open);
        if (!open) {
          setUnavailabilityDraft(null);
        }
      }}
    >
      <DialogContent className="p-4 sm:max-w-120 sm:p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl">Add Unavailability</DialogTitle>
          <DialogDescription className="text-sm">
            Block this barber from receiving bookings during selected time.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            if (!createBarberUnavailability) {
              toast.error("Create unavailability action is not connected.");
              return;
            }

            await runBookingMutation(
              createBarberUnavailability,
              formData,
              "Unavailability added.",
              () => {
                setUnavailabilityDialogOpen(false);
                setUnavailabilityDraft(null);
              },
            );
          }}
          className="space-y-3"
        >
          <input
            type="hidden"
            name="barber_id"
            value={unavailabilityDraft.barberId}
          />
          <input
            type="hidden"
            name="start_at"
            value={unavailabilityTiming.startAt}
          />
          <input
            type="hidden"
            name="end_at"
            value={unavailabilityTiming.endAt}
          />
          <div className="space-y-2">
            <label className="text-xs font-medium">Barber</label>
            <Input
              value={unavailabilityDraft.barberName}
              className="h-9"
              disabled
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium" htmlFor="ua-date">
                Date *
              </label>
              <Input
                id="ua-date"
                type="date"
                value={unavailabilityDraft.date}
                onChange={(event) =>
                  setUnavailabilityDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          date: event.target.value,
                        }
                      : prev,
                  )
                }
                className="h-9"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Time *</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={unavailabilityDraft.startTime}
                  onChange={(event) =>
                    setUnavailabilityDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            startTime: event.target.value,
                          }
                        : prev,
                    )
                  }
                  className="h-9"
                  required
                />
                <Input
                  type="time"
                  value={unavailabilityDraft.endTime}
                  onChange={(event) =>
                    setUnavailabilityDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            endTime: event.target.value,
                          }
                        : prev,
                    )
                  }
                  className="h-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium" htmlFor="ua-reason">
              Reason
            </label>
            <textarea
              id="ua-reason"
              name="reason"
              value={unavailabilityDraft.reason}
              placeholder="Lunch break, emergency, training, etc."
              onChange={(event) =>
                setUnavailabilityDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        reason: event.target.value,
                      }
                    : prev,
                )
              }
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUnavailabilityDialogOpen(false);
                setUnavailabilityDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                !createBarberUnavailability ||
                !unavailabilityDraft.barberId ||
                !unavailabilityDraft.date ||
                !unavailabilityDraft.startTime ||
                !unavailabilityDraft.endTime ||
                !unavailabilityTiming.startAt ||
                !unavailabilityTiming.endAt
              }
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;
  const calendarBookingDialog = calendarDialogBooking ? (
    <Dialog
      open={Boolean(calendarDialogBookingId)}
      onOpenChange={(open) =>
        setCalendarDialogBookingId(open ? calendarDialogBooking.id : null)
      }
    >
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
                {getBookingCustomerName(calendarDialogBooking)}
              </p>
              <p className="text-sm text-muted-foreground">
                {getBookingCustomerContact(calendarDialogBooking)}
              </p>
            </div>
            <div className="flex justify-start sm:justify-end">
              <Badge
                variant="outline"
                className={`${getStatusTone(calendarDialogBooking.status ?? null).badge} shrink-0`}
              >
                {formatStatusLabel(calendarDialogBooking.status ?? null)}
              </Badge>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {formatDate(
                  calendarDialogBooking.booking_date ??
                    calendarDialogBooking.start_at,
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-medium">
                {formatTime(calendarDialogBooking.start_at)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="font-medium">
                {calendarDialogBooking.service?.name ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {calendarDialogBooking.service?.duration_minutes
                  ? `${calendarDialogBooking.service.duration_minutes} min`
                  : "Duration not set"}{" "}
                ·{" "}
                {formatMoney(calendarDialogBooking.service?.base_price ?? null)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Barber</p>
              <p className="font-medium">
                {joinName(
                  calendarDialogBooking.barber?.first_name ?? null,
                  calendarDialogBooking.barber?.last_name ?? null,
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <label
              className="text-sm font-semibold"
              htmlFor={`calendar-status-${calendarDialogBooking.id}`}
            >
              Update status
            </label>
            <form
              id={`calendar-update-booking-${calendarDialogBooking.id}`}
              action={async (formData) => {
                await runBookingMutation(
                  updateBookingStatus,
                  formData,
                  "Booking status updated.",
                  () => setCalendarDialogBookingId(null),
                );
              }}
              className="contents"
            >
              <input type="hidden" name="id" value={calendarDialogBooking.id} />
              <input
                type="hidden"
                name="status"
                value={
                  statusSelections[calendarDialogBooking.id] ??
                  calendarDialogBooking.status ??
                  "scheduled"
                }
              />
              <Select
                value={
                  statusSelections[calendarDialogBooking.id] ??
                  calendarDialogBooking.status ??
                  "scheduled"
                }
                onValueChange={(value) =>
                  setStatusSelections((prev) => ({
                    ...prev,
                    [calendarDialogBooking.id]: value,
                  }))
                }
              >
                <SelectTrigger
                  id={`calendar-status-${calendarDialogBooking.id}`}
                  className={`${statusSelectClass(
                    statusSelections[calendarDialogBooking.id] ??
                      calendarDialogBooking.status ??
                      "scheduled",
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
                form={`calendar-update-booking-${calendarDialogBooking.id}`}
              >
                Update status
              </Button>
              {allowCancel && cancelBooking ? (
                <form
                  id={`calendar-cancel-booking-${calendarDialogBooking.id}`}
                  action={async (formData) => {
                    if (!cancelBooking) {
                      return;
                    }
                    await runBookingMutation(
                      cancelBooking,
                      formData,
                      "Booking cancelled.",
                      () => setCalendarDialogBookingId(null),
                    );
                  }}
                >
                  <input
                    type="hidden"
                    name="id"
                    value={calendarDialogBooking.id}
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
  ) : null;

  const calendarView = (
    <div className="rounded-2xl border border-border/60 bg-card">
      {calendarBarbers.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No barber data available for calendar view.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-275">
            <div
              className="grid border-b border-border/60 bg-muted/20"
              style={{
                gridTemplateColumns: `${CALENDAR_TIME_COLUMN_WIDTH}px repeat(${calendarBarbers.length}, minmax(0, 1fr))`,
              }}
            >
              <div
                className="flex h-11 items-center justify-center px-3 text-center text-xs font-semibold uppercase tracking-normal text-muted-foreground"
                style={{ gridColumn: `1 / span ${calendarBarbers.length + 1}` }}
              >
                {calendarWeekLabel}
              </div>
            </div>
            <div
              className="grid border-b border-border/60 bg-muted/40"
              style={{
                gridTemplateColumns: `${CALENDAR_TIME_COLUMN_WIDTH}px repeat(${calendarBarbers.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="flex items-center justify-center border-r border-border/60 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Time
              </div>
              {calendarBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="flex h-18 items-center justify-center gap-2 border-r border-border/60 px-3 py-3 last:border-r-0"
                >
                  <Avatar className="size-8 ring-2 ring-background">
                    <AvatarFallback
                      className={`text-[11px] font-semibold ${barber.tone}`}
                    >
                      {barber.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {barber.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {barber.workingHoursLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `${CALENDAR_TIME_COLUMN_WIDTH}px repeat(${calendarBarbers.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="border-r border-border/60">
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: `repeat(${calendarSlots.length}, ${CALENDAR_ROW_HEIGHT}px)`,
                  }}
                >
                  {calendarSlots.map((slot, index) => (
                    <div
                      key={`${slot.label}-${index}`}
                      className="flex items-center justify-center border-b border-border/60 px-2 text-center text-[11px] text-muted-foreground"
                    >
                      {slot.show ? slot.label : null}
                    </div>
                  ))}
                </div>
              </div>
              {calendarBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="relative border-r border-border/60 last:border-r-0"
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateRows: `repeat(${calendarSlots.length}, ${CALENDAR_ROW_HEIGHT}px)`,
                    }}
                  >
                    {calendarSlots.map((slot, index) => {
                      const slotStart =
                        calendarVisibleRange.startMinutes +
                        index * CALENDAR_SLOT_MINUTES;
                      const slotEnd = slotStart + CALENDAR_SLOT_MINUTES;
                      const slotDateKey = toCalendarDateKey(calendarDate);
                      const slotStartISO = toIsoFromCalendarSlot(
                        slotDateKey,
                        slotStart,
                      );
                      const slotEndISO = toIsoFromCalendarSlot(
                        slotDateKey,
                        slotEnd,
                      );
                      const isRestSlot =
                        Boolean(slotStartISO) &&
                        Boolean(slotEndISO) &&
                        hasRestWindowOverlap(
                          slotStartISO as string,
                          slotEndISO as string,
                          shopRestWindows,
                        );
                      const isSlotSelectable = canCreateInSlot(
                        barber.id,
                        index,
                      );
                      if (!isSlotSelectable) {
                        return (
                          <div
                            key={`${barber.id}-${index}`}
                            className="group relative border-b border-border/60 transition-colors"
                          >
                            {isRestSlot ? (
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                                Rest
                              </span>
                            ) : null}
                          </div>
                        );
                      }

                      return (
                        <DropdownMenu key={`${barber.id}-${index}`}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="group relative h-full w-full cursor-pointer border-b border-border/60 text-left transition-colors hover:bg-primary/20"
                              aria-label={`Open slot actions for ${barber.name} at ${slot.label}`}
                            >
                              <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-2xl font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                +
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem
                              onSelect={() =>
                                openCreateBookingDialog(
                                  barber.id,
                                  barber.name,
                                  index,
                                )
                              }
                            >
                              <Plus />
                              <span>Add Booking</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                openUnavailabilityDialog(
                                  barber.id,
                                  barber.name,
                                  index,
                                )
                              }
                            >
                              <CircleOff />
                              <span>Add Unavailability</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    })}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateRows: `repeat(${calendarSlots.length}, ${CALENDAR_ROW_HEIGHT}px)`,
                    }}
                  >
                    {calendarUnavailabilityEvents
                      .filter((event) => event.barberId === barber.id)
                      .map((event) => (
                        <div
                          key={`unavailable-${event.id}`}
                          style={{
                            gridRow: `${event.startRow} / ${event.endRow}`,
                          }}
                          className="pointer-events-auto flex min-h-full flex-col justify-between gap-2 overflow-hidden border border-amber-300/90 bg-amber-100/95 px-3 py-2 text-[11px] leading-tight text-amber-900 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                              <CircleOff className="size-3.5 shrink-0" />
                              Unavailable
                            </span>
                            {deleteBarberUnavailability ? (
                              <form
                                action={async (formData) => {
                                  await runBookingMutation(
                                    deleteBarberUnavailability,
                                    formData,
                                    "Unavailability removed.",
                                  );
                                }}
                                className="shrink-0"
                              >
                                <input
                                  type="hidden"
                                  name="unavailability_id"
                                  value={event.id}
                                />
                                <Button
                                  type="submit"
                                  size="icon"
                                  variant="ghost"
                                  className="size-6 text-amber-800 hover:bg-amber-200/70 hover:text-amber-950"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </form>
                            ) : null}
                          </div>
                          {event.reason ? (
                            <span className="text-[11px] font-medium leading-snug text-amber-950">
                              {event.reason}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700/85">
                              Barber blocked for this slot
                            </span>
                          )}
                        </div>
                      ))}
                    {calendarEvents
                      .filter((event) => event.barberId === barber.id)
                      .map((event) => (
                        <button
                          type="button"
                          key={event.id}
                          style={{
                            gridRow: `${event.startRow} / ${event.endRow}`,
                          }}
                          className={`pointer-events-auto flex min-h-full cursor-pointer flex-col overflow-hidden border border-l-4 px-3 py-2 text-[11px] leading-normal transition-all hover:shadow-sm ${event.cardTone} ${event.accentTone}`}
                          onClick={() => setCalendarDialogBookingId(event.id)}
                          aria-label={`Open booking details for ${event.client}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-[12px] font-semibold leading-tight tracking-tight">
                              {event.time}
                            </span>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase leading-tight ${event.statusTone}`}
                            >
                              {event.status}
                            </span>
                          </div>
                          <div className="mt-auto flex items-end justify-between gap-2">
                            <span className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold leading-tight">
                              {event.client}
                            </span>
                            <span className="shrink-0 truncate text-right text-[10px] opacity-80">
                              {event.service}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const activeList =
    upcomingBookings.length === 0 ? (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
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
              <TableHead
                className={`${bookingColumnClass.date} ${bookingTableHeadClass}`}
              >
                Date
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.time} ${bookingTableHeadClass}`}
              >
                Time
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.customer} ${bookingTableHeadClass}`}
              >
                Customer
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.service} ${bookingTableHeadClass}`}
              >
                Service
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.barber} ${bookingTableHeadClass}`}
              >
                Barber
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.status} ${bookingTableHeadClass} text-center`}
              >
                Status
              </TableHead>
              {showActions ? (
                <TableHead
                  className={`${bookingColumnClass.actions} ${bookingTableHeadActionsClass}`}
                >
                  Actions
                </TableHead>
              ) : null}
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
                  <TableCell
                    className={`${bookingColumnClass.date} ${bookingTableCellClass} text-muted-foreground`}
                  >
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.time} ${bookingTableCellClass} font-semibold text-foreground`}
                  >
                    {formatTime(booking.start_at)}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.customer} ${bookingTableCellClass} text-foreground`}
                  >
                    {getBookingCustomerName(booking)}
                    <div className="text-xs text-muted-foreground">
                      {getBookingCustomerContact(booking)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.service} ${bookingTableCellClass} text-foreground`}
                  >
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.barber} ${bookingTableCellClass} text-foreground`}
                  >
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null,
                    )}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.status} ${bookingTableCellClass} text-center`}
                  >
                    <div className="flex justify-center">
                      <Badge variant="outline" className={tone.badge}>
                        {formatStatusLabel(booking.status ?? null)}
                      </Badge>
                    </div>
                  </TableCell>
                  {showActions ? (
                    <TableCell
                      className={`${bookingColumnClass.actions} ${bookingTableCellActionsClass}`}
                    >
                      <div className="flex justify-end">
                        <Dialog
                          open={openDialogId === booking.id}
                          onOpenChange={(open) =>
                            setOpenDialogId(open ? booking.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setOpenDialogId(booking.id)}
                            >
                              <Pencil />
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
                                    {getBookingCustomerName(booking)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {getBookingCustomerContact(booking)}
                                  </p>
                                </div>
                                <div className="flex justify-start sm:justify-end">
                                  <Badge
                                    variant="outline"
                                    className={`${tone.badge} shrink-0`}
                                  >
                                    {formatStatusLabel(booking.status ?? null)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Date
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(
                                      booking.booking_date ?? booking.start_at,
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Time
                                  </p>
                                  <p className="font-medium">
                                    {formatTime(booking.start_at)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Service
                                  </p>
                                  <p className="font-medium">
                                    {booking.service?.name ?? "-"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.service?.duration_minutes
                                      ? `${booking.service.duration_minutes} min`
                                      : "Duration not set"}{" "}
                                    ·{" "}
                                    {formatMoney(
                                      booking.service?.base_price ?? null,
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Barber
                                  </p>
                                  <p className="font-medium">
                                    {joinName(
                                      booking.barber?.first_name ?? null,
                                      booking.barber?.last_name ?? null,
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
                                  action={async (formData) => {
                                    await runBookingMutation(
                                      updateBookingStatus,
                                      formData,
                                      "Booking status updated.",
                                      () => setOpenDialogId(null),
                                    );
                                  }}
                                  className="contents"
                                >
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={booking.id}
                                  />
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
                                          "scheduled",
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
                                      action={async (formData) => {
                                        if (!cancelBooking) {
                                          return;
                                        }
                                        await runBookingMutation(
                                          cancelBooking,
                                          formData,
                                          "Booking cancelled.",
                                          () => setOpenDialogId(null),
                                        );
                                      }}
                                    >
                                      <input
                                        type="hidden"
                                        name="id"
                                        value={booking.id}
                                      />
                                      <Button
                                        variant="destructive"
                                        type="submit"
                                      >
                                        Cancel booking
                                      </Button>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );

  const pastList =
    pastBookings.length === 0 ? (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
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
              <TableHead
                className={`${bookingColumnClass.date} ${bookingTableHeadClass}`}
              >
                Date
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.time} ${bookingTableHeadClass}`}
              >
                Time
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.customer} ${bookingTableHeadClass}`}
              >
                Customer
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.service} ${bookingTableHeadClass}`}
              >
                Service
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.barber} ${bookingTableHeadClass}`}
              >
                Barber
              </TableHead>
              <TableHead
                className={`${bookingColumnClass.status} ${bookingTableHeadClass} text-center`}
              >
                Status
              </TableHead>
              {showActions ? (
                <TableHead
                  className={`${bookingColumnClass.actions} ${bookingTableHeadActionsClass}`}
                >
                  Actions
                </TableHead>
              ) : null}
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
                  <TableCell
                    className={`${bookingColumnClass.date} ${bookingTableCellClass} text-muted-foreground`}
                  >
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.time} ${bookingTableCellClass} font-semibold text-foreground`}
                  >
                    {formatTime(booking.start_at)}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.customer} ${bookingTableCellClass} text-foreground`}
                  >
                    {getBookingCustomerName(booking)}
                    <div className="text-xs text-muted-foreground">
                      {getBookingCustomerContact(booking)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.service} ${bookingTableCellClass} text-foreground`}
                  >
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.barber} ${bookingTableCellClass} text-foreground`}
                  >
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null,
                    )}
                  </TableCell>
                  <TableCell
                    className={`${bookingColumnClass.status} ${bookingTableCellClass} text-center`}
                  >
                    <div className="flex justify-center">
                      <Badge variant="outline" className={tone.badge}>
                        {formatStatusLabel(booking.status ?? null)}
                      </Badge>
                    </div>
                  </TableCell>
                  {showActions ? (
                    <TableCell
                      className={`${bookingColumnClass.actions} ${bookingTableCellActionsClass}`}
                    >
                      <div className="flex justify-end">
                        {allowDelete && deleteBooking ? (
                          <form
                            action={async (formData) => {
                              await runBookingMutation(
                                deleteBooking,
                                formData,
                                "Booking deleted.",
                              );
                            }}
                          >
                            <input type="hidden" name="id" value={booking.id} />
                            <Button
                              variant="destructive"
                              size="icon"
                              type="submit"
                            >
                              <Trash2 />
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
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
          {calendarWeekSelector}
          {createBookingDialog}
          {unavailabilityDialog}
          {calendarBookingDialog}
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
          {hasActiveFilters ? (
            <Badge variant="secondary">Filtered</Badge>
          ) : null}
        </div>
        <TabsContent value="active" className="space-y-3">
          <p className="text-xs text-muted-foreground">{activeDescription}</p>
          {activeList}
        </TabsContent>
        <TabsContent value="calendar" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Schedule overview by staff.
          </p>
          {calendarWeekSelector}
          {createBookingDialog}
          {unavailabilityDialog}
          {calendarBookingDialog}
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
