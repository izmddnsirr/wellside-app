"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type {
  RestWindow,
  TemporaryClosure,
  WeeklySchedule,
} from "@/utils/shop-operations";
import { WEEKDAY_KEYS } from "@/utils/shop-operations";
import {
  addRestWindow,
  addTemporaryClosure,
  deleteRestWindow,
  deleteTemporaryClosure,
  saveWeeklySchedule,
  updateBookingAvailability,
} from "./actions";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

const WEEKDAY_LABELS: Record<(typeof WEEKDAY_KEYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type OperationsSettingsPanelProps = {
  weeklySchedule: WeeklySchedule;
  temporaryClosures: TemporaryClosure[];
  restWindows: RestWindow[];
  bookingEnabled: boolean;
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+08:00`));

const formatDateInput = (value: Date | undefined) => {
  if (!value) {
    return "";
  }
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
};

const formatTimeLabel12h = (value: string) => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const date = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
};

export function OperationsSettingsPanel({
  weeklySchedule,
  temporaryClosures,
  restWindows,
  bookingEnabled,
}: OperationsSettingsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const searchParamsString = searchParams.toString();
  const [closureRange, setClosureRange] = useState<DateRange | undefined>();
  const [closureType, setClosureType] = useState<"closed" | "holiday">(
    "closed",
  );

  const closureRangeLabel = useMemo(() => {
    if (!closureRange?.from) {
      return "Select closure range";
    }
    if (!closureRange.to) {
      return formatDateLabel(formatDateInput(closureRange.from));
    }
    return `${formatDateLabel(formatDateInput(closureRange.from))} - ${formatDateLabel(
      formatDateInput(closureRange.to),
    )}`;
  }, [closureRange]);

  useEffect(() => {
    if (!toastKey) {
      return;
    }

    const messageMap: Record<
      string,
      { type: "success" | "error"; message: string }
    > = {
      "settings-weekly-saved": {
        type: "success",
        message: "Weekly schedule saved.",
      },
      "settings-weekly-error": {
        type: "error",
        message: "Failed to save weekly schedule.",
      },
      "settings-closure-added": {
        type: "success",
        message: "Temporary closure added.",
      },
      "settings-closure-removed": {
        type: "success",
        message: "Temporary closure removed.",
      },
      "settings-closure-invalid": {
        type: "error",
        message: "Invalid temporary closure input.",
      },
      "settings-closure-error": {
        type: "error",
        message: "Failed to update temporary closure.",
      },
      "settings-rest-added": {
        type: "success",
        message: "Rest window added.",
      },
      "settings-rest-removed": {
        type: "success",
        message: "Rest window removed.",
      },
      "settings-rest-invalid": {
        type: "error",
        message: "Invalid rest window input.",
      },
      "settings-rest-error": {
        type: "error",
        message: "Failed to update rest window.",
      },
      "settings-booking-updated": {
        type: "success",
        message: "Booking availability updated.",
      },
      "settings-booking-error": {
        type: "error",
        message: "Failed to update booking availability.",
      },
    };

    const config = messageMap[toastKey];
    if (config) {
      if (config.type === "success") {
        toast.success(config.message, { id: toastKey });
      } else {
        toast.error(config.message, { id: toastKey });
      }
    }

    const params = new URLSearchParams(searchParamsString);
    params.delete("toast");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [toastKey, pathname, router, searchParamsString]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Customer Booking</CardTitle>
            <Badge variant={bookingEnabled ? "secondary" : "outline"}>
              {bookingEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>
            Turn customer online booking on or off instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {bookingEnabled
                ? "Customers can create new bookings from the app."
                : "New customer bookings are currently blocked."}
            </p>
            <form action={updateBookingAvailability}>
              <input
                type="hidden"
                name="enabled"
                value={bookingEnabled ? "0" : "1"}
              />
              <Button type="submit" variant={bookingEnabled ? "destructive" : "default"}>
                {bookingEnabled ? "Turn off booking" : "Turn on booking"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Weekly Schedule</CardTitle>
            <Badge variant="outline">Fixed rules</Badge>
          </div>
          <CardDescription>
            Set fixed open/closed days for the whole shop.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form action={saveWeeklySchedule} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {WEEKDAY_KEYS.map((weekday) => (
                <Label
                  key={weekday}
                  htmlFor={`weekday-${weekday}`}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    id={`weekday-${weekday}`}
                    name={weekday}
                    defaultChecked={weeklySchedule[weekday]}
                  />
                  <span className="text-sm font-medium">
                    {WEEKDAY_LABELS[weekday]}
                  </span>
                </Label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save weekly schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Rest Time</CardTitle>
            <Badge variant="secondary">{restWindows.length} windows</Badge>
          </div>
          <CardDescription>
            Configure rest windows to block booking slots automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form
            action={addRestWindow}
            className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto] xl:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="rest-start">Rest start</Label>
              <Input id="rest-start" name="start_time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-end">Rest end</Label>
              <Input id="rest-end" name="end_time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-reason">Reason (optional)</Label>
              <Input id="rest-reason" name="reason" placeholder="Lunch break" />
            </div>
            <Button
              type="submit"
              className="w-full md:col-span-2 xl:col-span-1 xl:w-auto"
            >
              Add rest time
            </Button>
          </form>

          <div className="space-y-2">
            {restWindows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No rest windows configured yet.
              </div>
            ) : (
              restWindows.map((window) => (
                <div
                  key={window.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatTimeLabel12h(window.start_time)} -{" "}
                      {formatTimeLabel12h(window.end_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {window.reason || "No reason"}
                    </p>
                  </div>
                  <form action={deleteRestWindow}>
                    <input
                      type="hidden"
                      name="rest_window_id"
                      value={window.id}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Temporary Closures</CardTitle>
            <Badge variant="secondary">
              {temporaryClosures.length} entries
            </Badge>
          </div>
          <CardDescription>
            Add date-range closures (Raya, renovation, public holiday, etc).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form
            action={addTemporaryClosure}
            className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                      <span className="truncate">
                        {closureRange?.from ? closureRangeLabel : "dd/mm/yyyy"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden rounded-2xl border-border/80 p-0 shadow-none"
                    align="start"
                  >
                    <Calendar
                      mode="range"
                      defaultMonth={closureRange?.from}
                      selected={closureRange}
                      onSelect={setClosureRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="hidden"
                  name="start_date"
                  value={formatDateInput(closureRange?.from)}
                />
                <input
                  type="hidden"
                  name="end_date"
                  value={formatDateInput(
                    closureRange?.to ?? closureRange?.from,
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closure-type">Type</Label>
                <Select
                  value={closureType}
                  onValueChange={(value) =>
                    setClosureType(value === "holiday" ? "holiday" : "closed")
                  }
                >
                  <SelectTrigger id="closure-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Shop Close</SelectItem>
                    <SelectItem value="holiday">Public Holiday</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="closure_type" value={closureType} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closure-reason">Name / Reason</Label>
                <Input
                  id="closure-reason"
                  name="reason"
                  placeholder="e.g., Christmas, Renovation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-annually">Options</Label>
                <Label
                  htmlFor="repeat-annually"
                  className="flex items-center gap-2 pt-1 text-sm font-normal"
                >
                  <Checkbox id="repeat-annually" name="repeat_annually" />
                  Repeat annually
                </Label>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" className="w-full sm:w-auto">
                Add closure
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {temporaryClosures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                No temporary closure set.
              </div>
            ) : (
              temporaryClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {formatDateLabel(closure.start_date)} -{" "}
                        {formatDateLabel(closure.end_date)}
                      </p>
                      <Badge variant="outline">
                        {closure.closure_type === "holiday"
                          ? "Holiday"
                          : "Closed"}
                      </Badge>
                      {closure.repeat_annually ? (
                        <Badge variant="secondary">Repeat annually</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {closure.reason || "No reason"}
                    </p>
                  </div>
                  <form action={deleteTemporaryClosure}>
                    <input type="hidden" name="closure_id" value={closure.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
