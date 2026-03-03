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

export type BookingFormOption = {
  id: string;
  name: string;
  working_start_time?: string | null;
  working_end_time?: string | null;
};

export type ServiceFormOption = BookingFormOption & {
  durationMinutes: number | null;
};

type BookingsCardProps = {
  bookings: BookingRow[];
  errorMessage?: string | null;
  allowedStatuses: string[];
  updateBookingStatus: (formData: FormData) => Promise<void>;
  cancelBooking?: (formData: FormData) => Promise<void>;
  deleteBooking?: (formData: FormData) => Promise<void>;
  createBooking?: (formData: FormData) => Promise<void>;
  customerOptions?: BookingFormOption[];
  barberOptions?: BookingFormOption[];
  serviceOptions?: ServiceFormOption[];
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
        badge: "bg-blue-100 text-blue-900 border-blue-200",
        dot: "bg-blue-500",
      };
    case "in_progress":
      return {
        badge: "bg-amber-100 text-amber-900 border-amber-200",
        dot: "bg-amber-500",
      };
    case "completed":
      return {
        badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "no_show":
      return {
        badge: "bg-purple-100 text-purple-900 border-purple-200",
        dot: "bg-purple-500",
      };
    case "cancelled":
      return {
        badge: "bg-rose-100 text-rose-900 border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        badge: "bg-muted text-foreground border-border",
        dot: "bg-muted-foreground",
      };
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

const bookingTableHeadClass =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const bookingTableCellClass = "px-4 py-3";
const bookingColumnClass = {
  date: "w-[12%]",
  time: "w-[14%]",
  customer: "w-[22%]",
  service: "w-[18%]",
  barber: "w-[14%]",
  status: "w-[10%]",
  actions: "w-[10%]",
};
const bookingActionButtonClass = "w-28 justify-center";

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

const CALENDAR_START_MINUTES = 12 * 60;
const CALENDAR_END_MINUTES = 22 * 60;
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
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = ((hour24 + 11) % 12) + 1;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const minuteLabel = String(minute).padStart(2, "0");
  return `${hour12}:${minuteLabel} ${suffix}`;
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

export function BookingsCard({
  bookings,
  errorMessage,
  allowedStatuses,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  createBooking,
  customerOptions = [],
  barberOptions = [],
  serviceOptions = [],
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
  const [statusSelections, setStatusSelections] = useState<
    Record<string, string>
  >({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createBookingDraft, setCreateBookingDraft] = useState<{
    customerId: string;
    barberId: string;
    serviceId: string;
    startAt: string;
    endAt: string;
    dateLabel: string;
    timeLabel: string;
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
      const customerName = joinName(
        booking.customer?.first_name ?? null,
        booking.customer?.last_name ?? null,
      );
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
      const nameA = joinName(
        a.customer?.first_name ?? null,
        a.customer?.last_name ?? null,
      );
      const nameB = joinName(
        b.customer?.first_name ?? null,
        b.customer?.last_name ?? null,
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

  const calendarWeekDays = useMemo(() => {
    const weekStart = startOfWeek(calendarDate);
    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(weekStart);
      value.setDate(weekStart.getDate() + index);
      return startOfDay(value);
    });
  }, [calendarDate]);

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

  const calendarSlots = useMemo(() => {
    const slotCount =
      (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES;
    return Array.from({ length: slotCount }, (_, index) => {
      const minutes = CALENDAR_START_MINUTES + index * CALENDAR_SLOT_MINUTES;
      const hour24 = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const hour12 = ((hour24 + 11) % 12) + 1;
      const suffix = hour24 >= 12 ? "PM" : "AM";
      const minuteLabel = String(minute).padStart(2, "0");
      return {
        label: `${hour12}:${minuteLabel} ${suffix}`,
        show: true,
      };
    });
  }, []);

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
        const endMinutes = toMinutesInMalaysia(
          booking.end_at ?? booking.start_at,
        );

        const safeStart =
          startMinutes === null ? CALENDAR_START_MINUTES : startMinutes;
        const safeEnd =
          endMinutes === null
            ? safeStart + CALENDAR_SLOT_MINUTES
            : Math.max(endMinutes, safeStart + CALENDAR_SLOT_MINUTES);

        const clampedStart = Math.max(CALENDAR_START_MINUTES, safeStart);
        const clampedEnd = Math.min(CALENDAR_END_MINUTES, safeEnd);

        const startRow =
          Math.floor(
            (clampedStart - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES,
          ) + 1;
        const endRow = Math.max(
          startRow + 1,
          Math.ceil(
            (clampedEnd - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES,
          ) + 1,
        );

        const tone = getStatusTone(booking.status ?? null);

        return {
          id: booking.id,
          barberId,
          startRow,
          endRow,
          time: formatTimeRange(booking.start_at, booking.end_at),
          client: joinName(
            booking.customer?.first_name ?? null,
            booking.customer?.last_name ?? null,
          ),
          service: booking.service?.name ?? "-",
          tone: tone.badge,
        };
      });
  }, [calendarBarbers, calendarDateKey, calendarWeekBookings]);

  const hasCalendarBookings = calendarEvents.length > 0;
  const canCreateFromCalendar =
    Boolean(createBooking) &&
    customerOptions.length > 0 &&
    barberOptions.length > 0 &&
    serviceOptions.length > 0;

  const workingHoursByBarberId = useMemo(() => {
    return new Map(
      barberOptions.map((barberOption) => {
        const start = parseTimeToMinutes(barberOption.working_start_time);
        const end = parseTimeToMinutes(barberOption.working_end_time);
        return [barberOption.id, { start, end }] as const;
      }),
    );
  }, [barberOptions]);

  const canCreateInSlot = (barberId: string, slotIndex: number) => {
    if (!canCreateFromCalendar) {
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

    const slotStart =
      CALENDAR_START_MINUTES + slotIndex * CALENDAR_SLOT_MINUTES;
    const slotEnd = slotStart + CALENDAR_SLOT_MINUTES;
    return slotStart >= workingHours.start && slotEnd <= workingHours.end;
  };

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
      CALENDAR_START_MINUTES + slotIndex * CALENDAR_SLOT_MINUTES;
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
      customerId: customerOptions[0]?.id ?? "",
      barberId: preferredBarber?.id ?? barberOptions[0]?.id ?? "",
      serviceId: serviceOptions[0]?.id ?? "",
      startAt,
      endAt,
      dateLabel: formatCalendarDateLabel(calendarDate),
      timeLabel: formatTimeRange(startAt, endAt),
    });
    setCreateDialogOpen(true);
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const previousWeek = new Date(calendarDate);
            previousWeek.setDate(previousWeek.getDate() - 7);
            setCalendarDate(startOfDay(previousWeek));
          }}
        >
          Prev week
        </Button>
        <span className="text-xs text-muted-foreground">
          {calendarWeekLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const nextWeek = new Date(calendarDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            setCalendarDate(startOfDay(nextWeek));
          }}
        >
          Next week
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 py-1">
        {calendarWeekDays.map((day) => {
          const isActive = toCalendarDateKey(day) === calendarDateKey;
          return (
            <Button
              key={toCalendarDateKey(day)}
              variant={isActive ? "default" : "outline"}
              className="h-14 w-14 rounded-full p-0"
              onClick={() => setCalendarDate(startOfDay(day))}
            >
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[10px] uppercase tracking-wide">
                  {malaysiaWeekdayFormatter.format(day)}
                </span>
                <span className="text-xs font-semibold">
                  {malaysiaDayFormatter.format(day)}
                </span>
              </span>
            </Button>
          );
        })}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create booking</DialogTitle>
            <DialogDescription>
              Create a booking for {createBookingDraft.dateLabel} at{" "}
              {createBookingDraft.timeLabel}.
            </DialogDescription>
          </DialogHeader>
          <form
            action={createBooking}
            className="space-y-4"
            onSubmit={() => setCreateDialogOpen(false)}
          >
            <input
              type="hidden"
              name="start_at"
              value={createBookingDraft.startAt}
            />
            <input
              type="hidden"
              name="end_at"
              value={createBookingDraft.endAt}
            />
            <input
              type="hidden"
              name="customer_id"
              value={createBookingDraft.customerId}
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
              <p className="text-sm font-semibold">Customer</p>
              <Select
                value={createBookingDraft.customerId}
                onValueChange={(value) =>
                  setCreateBookingDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          customerId: value,
                        }
                      : prev,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Barber</p>
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
                <SelectTrigger>
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
              <p className="text-sm font-semibold">Service</p>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((serviceOption) => (
                    <SelectItem key={serviceOption.id} value={serviceOption.id}>
                      {serviceOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateBookingDraft(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create booking</Button>
            </div>
          </form>
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
                      const isSlotSelectable = canCreateInSlot(
                        barber.id,
                        index,
                      );
                      return (
                        <div
                          key={`${barber.id}-${index}`}
                          className={`group relative border-b border-border/60 transition-colors ${
                            isSlotSelectable
                              ? "cursor-pointer hover:bg-primary/20"
                              : "cursor-default"
                          }`}
                          onClick={() =>
                            openCreateBookingDialog(
                              barber.id,
                              barber.name,
                              index,
                            )
                          }
                        >
                          {isSlotSelectable ? (
                            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-2xl font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              +
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 grid"
                    style={{
                      gridTemplateRows: `repeat(${calendarSlots.length}, ${CALENDAR_ROW_HEIGHT}px)`,
                    }}
                  >
                    {calendarEvents
                      .filter((event) => event.barberId === barber.id)
                      .map((event) => (
                        <div
                          key={event.id}
                          style={{
                            gridRow: `${event.startRow} / ${event.endRow}`,
                          }}
                          className={`pointer-events-auto flex min-h-full flex-col gap-2 overflow-hidden rounded-lg border px-3 py-2 text-[11px] leading-tight ${event.tone}`}
                        >
                          <span className="truncate font-semibold">
                            {event.time}
                          </span>
                          <span className="truncate text-xs font-semibold">
                            {event.client}
                          </span>
                          <span className="truncate text-[10px] text-muted-foreground">
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
      )}
      {!hasCalendarBookings ? (
        <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          No bookings for {formatCalendarDateLabel(calendarDate)}.
        </div>
      ) : null}
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
              <TableHead className={`${bookingColumnClass.date} ${bookingTableHeadClass}`}>
                Date
              </TableHead>
              <TableHead className={`${bookingColumnClass.time} ${bookingTableHeadClass}`}>
                Time
              </TableHead>
              <TableHead className={`${bookingColumnClass.customer} ${bookingTableHeadClass}`}>
                Customer
              </TableHead>
              <TableHead className={`${bookingColumnClass.service} ${bookingTableHeadClass}`}>
                Service
              </TableHead>
              <TableHead className={`${bookingColumnClass.barber} ${bookingTableHeadClass}`}>
                Barber
              </TableHead>
              <TableHead className={`${bookingColumnClass.status} ${bookingTableHeadClass}`}>
                Status
              </TableHead>
              {showActions ? (
                <TableHead className={`${bookingColumnClass.actions} ${bookingTableHeadClass}`}>
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
                  <TableCell className={`${bookingColumnClass.date} ${bookingTableCellClass} text-muted-foreground`}>
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.time} ${bookingTableCellClass} font-semibold text-foreground`}>
                    {formatTime(booking.start_at)}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.customer} ${bookingTableCellClass} text-foreground`}>
                    {joinName(
                      booking.customer?.first_name ?? null,
                      booking.customer?.last_name ?? null,
                    )}
                    <div className="text-xs text-muted-foreground">
                      {booking.customer?.phone ||
                        booking.customer?.email ||
                        "-"}
                    </div>
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.service} ${bookingTableCellClass} text-foreground`}>
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.barber} ${bookingTableCellClass} text-foreground`}>
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null,
                    )}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.status} ${bookingTableCellClass}`}>
                    <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                      <span className={`size-2 rounded-full ${tone.dot}`} />
                      {formatStatusLabel(booking.status ?? null)}
                    </Badge>
                  </TableCell>
                  {showActions ? (
                    <TableCell className={`${bookingColumnClass.actions} ${bookingTableCellClass}`}>
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
                            className={bookingActionButtonClass}
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
                                    booking.customer?.last_name ?? null,
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
                                  <span
                                    className={`size-2 rounded-full ${tone.dot}`}
                                  />
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
                                action={updateBookingStatus}
                                className="contents"
                                onSubmit={() => setOpenDialogId(null)}
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
              <TableHead className={`${bookingColumnClass.date} ${bookingTableHeadClass}`}>
                Date
              </TableHead>
              <TableHead className={`${bookingColumnClass.time} ${bookingTableHeadClass}`}>
                Time
              </TableHead>
              <TableHead className={`${bookingColumnClass.customer} ${bookingTableHeadClass}`}>
                Customer
              </TableHead>
              <TableHead className={`${bookingColumnClass.service} ${bookingTableHeadClass}`}>
                Service
              </TableHead>
              <TableHead className={`${bookingColumnClass.barber} ${bookingTableHeadClass}`}>
                Barber
              </TableHead>
              <TableHead className={`${bookingColumnClass.status} ${bookingTableHeadClass}`}>
                Status
              </TableHead>
              {showActions ? (
                <TableHead className={`${bookingColumnClass.actions} ${bookingTableHeadClass}`}>
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
                  <TableCell className={`${bookingColumnClass.date} ${bookingTableCellClass} text-muted-foreground`}>
                    {formatDate(booking.booking_date ?? booking.start_at)}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.time} ${bookingTableCellClass} font-semibold text-foreground`}>
                    {formatTime(booking.start_at)}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.customer} ${bookingTableCellClass} text-foreground`}>
                    {joinName(
                      booking.customer?.first_name ?? null,
                      booking.customer?.last_name ?? null,
                    )}
                    <div className="text-xs text-muted-foreground">
                      {booking.customer?.phone ||
                        booking.customer?.email ||
                        "-"}
                    </div>
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.service} ${bookingTableCellClass} text-foreground`}>
                    {booking.service?.name ?? "-"}
                    <div className="text-xs text-muted-foreground">
                      {booking.service?.duration_minutes
                        ? `${booking.service.duration_minutes} min`
                        : "Duration not set"}{" "}
                      · {formatMoney(booking.service?.base_price ?? null)}
                    </div>
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.barber} ${bookingTableCellClass} text-foreground`}>
                    {joinName(
                      booking.barber?.first_name ?? null,
                      booking.barber?.last_name ?? null,
                    )}
                  </TableCell>
                  <TableCell className={`${bookingColumnClass.status} ${bookingTableCellClass}`}>
                    <Badge variant="outline" className={`gap-2 ${tone.badge}`}>
                      <span className={`size-2 rounded-full ${tone.dot}`} />
                      {formatStatusLabel(booking.status ?? null)}
                    </Badge>
                  </TableCell>
                  {showActions ? (
                    <TableCell className={`${bookingColumnClass.actions} ${bookingTableCellClass}`}>
                      {allowDelete && deleteBooking ? (
                        <form action={deleteBooking}>
                          <input type="hidden" name="id" value={booking.id} />
                          <Button
                            variant="destructive"
                            size="sm"
                            type="submit"
                            className={bookingActionButtonClass}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                        </form>
                      ) : null}
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
