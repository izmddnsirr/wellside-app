"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingSummaryCard } from "@/components/customer/booking-summary-card";
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/utils/supabase/client";
import { getAvailableSlots, type Slot } from "@/utils/slots";

const TIME_ZONE = "Asia/Kuala_Lumpur";
const MAX_DAYS_AHEAD = 14;

type DateOption = {
  id: string;
  label: string;
  detail: string;
  date: Date;
  fullLabel: string;
};

type SlotState = {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;
};

type BarberRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  barber_level: string | null;
  is_active: boolean | null;
};

type BookingQuery = {
  serviceId?: string;
  service?: string;
  duration?: string;
  price?: string;
  total?: string;
  date?: string;
  time?: string;
  barber?: string;
  barberId?: string;
  startAt?: string;
  endAt?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

const getDateParts = (date: Date) => {
  const parts = dateFormatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    weekday: getPart("weekday"),
  };
};

const formatISOFromParts = (parts: {
  year: number;
  month: number;
  day: number;
}) => {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
};

const formatDateISO = (date: Date) => formatISOFromParts(getDateParts(date));

const buildDateOptions = (): DateOption[] => {
  const now = new Date();
  const todayParts = getDateParts(now);
  const todayUTC = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day)
  );

  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, index) => {
    const date = new Date(todayUTC);
    date.setUTCDate(todayUTC.getUTCDate() + index);

    const parts = getDateParts(date);

    return {
      id: formatISOFromParts(parts),
      label: String(parts.day),
      detail: parts.weekday,
      date,
      fullLabel: fullDateFormatter.format(date),
    };
  });
};

const buildQuery = (params: BookingQuery) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const buildInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function SelectTimePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const serviceName = searchParams.get("service") ?? undefined;
  const serviceDuration = searchParams.get("duration") ?? undefined;
  const servicePrice = searchParams.get("price") ?? undefined;
  const totalPrice = searchParams.get("total") ?? undefined;
  const serviceId = searchParams.get("serviceId") ?? undefined;
  const selectedTime = searchParams.get("time") ?? undefined;
  const barberName = searchParams.get("barber") ?? undefined;
  const barberId = searchParams.get("barberId") ?? undefined;
  const selectedStartAt = searchParams.get("startAt") ?? undefined;
  const selectedEndAt = searchParams.get("endAt") ?? undefined;
  const selectedDateParam = searchParams.get("date") ?? undefined;
  const resolvedDateLabel =
    selectedDateParam ?? dateOptions[0]?.fullLabel ?? undefined;
  const selectedDate =
    dateOptions.find((option) => option.fullLabel === resolvedDateLabel) ??
    dateOptions[0];
  const monthYearLabel = selectedDate
    ? monthYearFormatter.format(selectedDate.date)
    : "";
  const dateISO = selectedDate ? formatDateISO(selectedDate.date) : null;
  const barberLabel = barberName ?? "Select barber";
  const barberInitials = buildInitials(
    barberLabel === "Select barber" ? "Barber" : barberLabel
  );

  const [slotState, setSlotState] = useState<SlotState>({
    slots: [],
    isLoading: false,
    error: null,
  });
  const slotsCacheRef = useRef(new Map<string, Slot[]>());
  const [isBarberDialogOpen, setIsBarberDialogOpen] = useState(false);
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
  const [barberError, setBarberError] = useState<string | null>(null);

  const updateQuery = useCallback(
    (next: BookingQuery) => {
      const query = buildQuery({
        serviceId,
        service: serviceName,
        duration: serviceDuration,
        price: servicePrice,
        total: totalPrice ?? servicePrice,
        date: resolvedDateLabel,
        time: selectedTime,
        barber: barberName,
        barberId,
        startAt: selectedStartAt,
        endAt: selectedEndAt,
        ...next,
      });
      router.replace(`/booking/time${query}`, { scroll: false });
    },
    [
      router,
      serviceId,
      serviceName,
      serviceDuration,
      servicePrice,
      totalPrice,
      resolvedDateLabel,
      selectedTime,
      barberName,
      barberId,
      selectedStartAt,
      selectedEndAt,
    ]
  );

  const handleSelectSlot = useCallback(
    (slot: Slot) => {
      const next = {
        time: slot.label,
        date: resolvedDateLabel,
        startAt: slot.start_at,
        endAt: slot.end_at,
      };

      if (isMobile) {
        const query = buildQuery({
          serviceId,
          service: serviceName,
          duration: serviceDuration,
          price: servicePrice,
          total: totalPrice ?? servicePrice,
          barber: barberName,
          barberId,
          ...next,
        });
        router.push(`/booking/review${query}`);
        return;
      }

      updateQuery(next);
    },
    [
      isMobile,
      router,
      updateQuery,
      barberId,
      barberName,
      resolvedDateLabel,
      serviceDuration,
      serviceId,
      serviceName,
      servicePrice,
      totalPrice,
    ]
  );

  const fetchBarbers = useCallback(async () => {
    setIsLoadingBarbers(true);
    setBarberError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, role, first_name, last_name, display_name, avatar_url, barber_level, is_active"
      )
      .eq("is_active", true)
      .eq("role", "barber")
      .order("display_name");

    if (error) {
      setBarberError("Unable to load barbers right now.");
      setBarbers([]);
    } else {
      setBarbers(data ?? []);
    }
    setIsLoadingBarbers(false);
  }, []);

  useEffect(() => {
    if (isBarberDialogOpen && barbers.length === 0 && !isLoadingBarbers) {
      fetchBarbers();
    }
  }, [isBarberDialogOpen, barbers.length, isLoadingBarbers, fetchBarbers]);

  useEffect(() => {
    let isActive = true;

    if (!serviceName || !serviceDuration || !servicePrice || !serviceId) {
      router.replace("/booking/services");
      return () => {
        isActive = false;
      };
    }

    if (!barberId || !barberName) {
      router.replace(
        `/booking/barbers${buildQuery({
          serviceId,
          service: serviceName,
          duration: serviceDuration,
          price: servicePrice,
          total: totalPrice ?? servicePrice,
        })}`
      );
      return () => {
        isActive = false;
      };
    }

    if (!barberId || !dateISO) {
      setSlotState({
        slots: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    const cacheKey = `${barberId}|${dateISO}`;
    const cachedSlots = slotsCacheRef.current.get(cacheKey);
    if (cachedSlots) {
      setSlotState({ slots: cachedSlots, isLoading: false, error: null });
      return;
    }

    setSlotState((prev) => ({ ...prev, isLoading: true, error: null }));

    getAvailableSlots(barberId, dateISO)
      .then((slots) => {
        if (isActive) {
          slotsCacheRef.current.set(cacheKey, slots);
          setSlotState({ slots, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (isActive) {
          setSlotState({
            slots: [],
            isLoading: false,
            error: "Unable to load available slots right now.",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [barberId, dateISO]);

  const professionals = useMemo(
    () =>
      barbers.map((barber) => {
        const displayName =
          barber.display_name?.trim() ||
          [barber.first_name, barber.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          "Barber";

        return {
          id: barber.id,
          name: displayName,
          initials: buildInitials(displayName) || "B",
          level: barber.barber_level?.trim() || null,
        };
      }),
    [barbers]
  );

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-[1200px]">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-col gap-6 lg:flex-[1.4] lg:min-w-0">
            <header className="space-y-4">
              <div className="lg:hidden">
                <BookingFlowActions backHref="/booking/barbers" />
              </div>
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="text-sm">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/booking">Booking</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/booking/services">Services</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/booking/barbers">Barbers</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Time</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-slate-400">Review</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-slate-400">Confirmed</span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
                  Select time
                </h1>
                <p className="text-sm text-slate-500 lg:text-base">
                  Pick a slot that fits your day.
                </p>
              </div>
            </header>

            <section className="space-y-6" style={{ animationDelay: "80ms" }}>
              <Dialog
                open={isBarberDialogOpen}
                onOpenChange={setIsBarberDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto w-fit rounded-full border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-none"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                      {barberInitials}
                    </span>
                    <span className="text-slate-900">{barberLabel}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:max-w-[720px]">
                  <DialogHeader className="space-y-3 text-left">
                    <DialogTitle className="text-2xl font-semibold text-slate-900">
                      Select barber
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                      Switch to another barber for this slot.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="pt-4">
                    {isLoadingBarbers ? (
                      <p className="text-sm text-slate-500">
                        Loading barbers...
                      </p>
                    ) : null}
                    {barberError ? (
                      <p className="text-sm text-red-500">{barberError}</p>
                    ) : null}
                    {!isLoadingBarbers &&
                    !barberError &&
                    professionals.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No barbers available right now.
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {professionals.map((pro) => {
                        const isSelected = barberId
                          ? barberId === pro.id
                          : barberName === pro.name;
                        return (
                          <button
                            key={pro.id}
                            type="button"
                            onClick={() => {
                              updateQuery({
                                barber: pro.name,
                                barberId: pro.id,
                                time: undefined,
                                startAt: undefined,
                                endAt: undefined,
                              });
                              setIsBarberDialogOpen(false);
                            }}
                            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                              isSelected
                                ? "border-slate-900/70 bg-slate-50"
                                : "border-slate-200/80 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                              {pro.initials}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">
                                {pro.name}
                              </span>
                              {pro.level ? (
                                <span className="block text-xs text-slate-500">
                                  {pro.level}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                <p className="text-lg font-semibold text-slate-900">
                  {monthYearLabel}
                </p>
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {dateOptions.map((option) => {
                    const isSelected = option.id === selectedDate?.id;
                    return (
                      <div
                        key={option.id}
                        className="flex flex-col items-center gap-3"
                      >
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          onClick={() =>
                            updateQuery({
                              date: option.fullLabel,
                              time: undefined,
                              startAt: undefined,
                              endAt: undefined,
                            })
                          }
                          className={`h-20 w-20 rounded-full text-lg font-semibold shadow-none ${
                            isSelected
                              ? "bg-slate-900 text-white hover:bg-slate-900/90"
                              : "border-slate-200/80 bg-white/80 text-slate-900"
                          }`}
                        >
                          {option.label}
                        </Button>
                        <span className="text-sm text-slate-500">
                          {option.detail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="space-y-4" style={{ animationDelay: "160ms" }}>
              {!barberId ? (
                <p className="text-sm text-slate-500">
                  Select a barber to see available slots.
                </p>
              ) : null}
              {barberId && slotState.isLoading ? (
                <p className="text-sm text-slate-500">
                  Loading available slots...
                </p>
              ) : null}
              {barberId && slotState.error ? (
                <p className="text-sm text-red-500">{slotState.error}</p>
              ) : null}
              {barberId &&
              !slotState.isLoading &&
              !slotState.error &&
              slotState.slots.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No available slots right now.
                </p>
              ) : null}
              {slotState.slots.map((slot) => {
                const isSelected = selectedTime === slot.label;
                return (
                  <Button
                    key={slot.label}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleSelectSlot(slot)}
                    className={`h-auto w-full justify-start rounded-3xl px-6 py-5 text-left text-base font-semibold shadow-none transition ${
                      isSelected
                        ? "bg-slate-900 text-white hover:bg-slate-900/90"
                        : "border-slate-200/80 bg-white/80 text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    {slot.label}
                  </Button>
                );
              })}
            </section>
          </div>

          <aside className="hidden lg:block lg:flex-[1] lg:self-start">
            <div className="sticky top-6">
              <BookingSummaryCard
                ctaHref={`/booking/review${buildQuery({
                  serviceId,
                  service: serviceName,
                  duration: serviceDuration,
                  price: servicePrice,
                  total: totalPrice ?? servicePrice,
                  date: resolvedDateLabel,
                  time: selectedTime,
                  barber: barberName,
                  barberId,
                  startAt: selectedStartAt,
                  endAt: selectedEndAt,
                })}`}
                bookingDate={resolvedDateLabel}
                bookingTime={selectedTime}
                barberName={barberName}
                serviceName={serviceName}
                serviceDuration={serviceDuration}
                servicePrice={servicePrice}
                totalPrice={totalPrice ?? servicePrice}
                requiredFields={[
                  "service",
                  "duration",
                  "price",
                  "barber",
                  "date",
                  "time",
                ]}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
