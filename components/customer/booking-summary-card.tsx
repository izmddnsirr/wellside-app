"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type BookingSummaryField =
  | "service"
  | "duration"
  | "price"
  | "date"
  | "time"
  | "barber";

type BookingSummaryCardProps = {
  ctaHref: string;
  ctaLabel?: string;
  bookingDate?: string;
  bookingTime?: string;
  barberName?: string;
  serviceName?: string;
  serviceDuration?: string;
  servicePrice?: string;
  totalPrice?: string;
  requiredFields?: BookingSummaryField[];
};

export function BookingSummaryCard({
  ctaHref,
  ctaLabel = "Continue",
  bookingDate,
  bookingTime,
  barberName,
  serviceName,
  serviceDuration,
  servicePrice,
  totalPrice,
  requiredFields,
}: BookingSummaryCardProps) {
  const searchParams = useSearchParams();
  const getParam = (key: string) => searchParams?.get(key) ?? undefined;

  const resolvedBookingDate = bookingDate ?? getParam("date");
  const resolvedBookingTime = bookingTime ?? getParam("time");
  const resolvedBarberName = barberName ?? getParam("barber");
  const resolvedServiceName = serviceName ?? getParam("service");
  const resolvedServiceDuration = serviceDuration ?? getParam("duration");
  const resolvedServicePrice = servicePrice ?? getParam("price");
  const resolvedTotalPrice =
    totalPrice ?? getParam("total") ?? resolvedServicePrice;

  const dateLabel = resolvedBookingDate ?? "-";
  const timeLabel = resolvedBookingTime ?? "-";
  const barberLabel = resolvedBarberName ?? "-";
  const hasDate = Boolean(resolvedBookingDate);
  const hasTime = Boolean(resolvedBookingTime);
  const hasBarber = Boolean(resolvedBarberName);
  const hasService = Boolean(resolvedServiceName);
  const hasDuration = Boolean(resolvedServiceDuration);
  const hasServicePrice = Boolean(resolvedServicePrice);
  const hasTotalPrice = Boolean(resolvedTotalPrice);
  const required: BookingSummaryField[] = requiredFields ?? [
    "service",
    "duration",
    "price",
    "date",
    "time",
  ];
  const readiness: Record<BookingSummaryField, boolean> = {
    service: hasService,
    duration: hasDuration,
    price: hasServicePrice,
    date: hasDate,
    time: hasTime,
    barber: hasBarber,
  };
  const isReady = required.every((field) => readiness[field]);
  const subtotalLabel = resolvedTotalPrice ?? "-";
  const totalLabel = resolvedTotalPrice ?? "-";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
      <div className="bg-slate-900 px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.45em] text-slate-300">
          Booking Details
        </p>
        <p
          className={`mt-3 text-xl font-semibold ${
            hasDate ? "text-white" : "text-slate-400"
          }`}
        >
          {dateLabel}
        </p>
        <p
          className={`mt-1 text-sm ${
            hasTime ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {timeLabel}
        </p>
        <p
          className={`mt-2 text-sm ${
            hasBarber ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {barberLabel}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
            Service
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-base font-semibold ${
                  hasService ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {resolvedServiceName ?? "-"}
              </p>
              <p
                className={`text-sm ${
                  hasDuration ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {resolvedServiceDuration ?? "-"}
              </p>
            </div>
            <p
              className={`text-base font-semibold ${
                hasServicePrice ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {resolvedServicePrice ?? "-"}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Separator className="mb-4 bg-slate-200" />
          <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
            Summary
          </p>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span
              className={hasTotalPrice ? "text-slate-600" : "text-slate-400"}
            >
              {subtotalLabel}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-slate-900">
            <span>Total</span>
            <span className={hasTotalPrice ? "text-slate-900" : "text-slate-400"}>
              {totalLabel}
            </span>
          </div>
        </div>

        {isReady ? (
          <Button
            asChild
            className="w-full rounded-full bg-slate-900 py-6 text-base font-semibold text-white hover:bg-slate-900/90"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button
            className="w-full rounded-full bg-slate-900 py-6 text-base font-semibold text-white"
            disabled
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
