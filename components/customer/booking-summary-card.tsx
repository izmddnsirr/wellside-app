"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User } from "lucide-react";
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
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
      <div className="bg-primary px-6 py-6">
        <p className="text-[11px] tracking-[0.2em] text-primary-foreground/70">
          Booking Details
        </p>
        <div className="mt-3 space-y-2">
          <p
            className={`text-xl font-semibold ${
              hasDate ? "text-primary-foreground" : "text-primary-foreground/60"
            }`}
          >
            {dateLabel}
          </p>
          <p
            className={`text-xl font-semibold ${
              hasTime ? "text-primary-foreground" : "text-primary-foreground/60"
            }`}
          >
            {timeLabel}
          </p>
          <p
            className={`text-xl font-semibold ${
              hasBarber ? "text-primary-foreground" : "text-primary-foreground/60"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Service with {barberLabel}
              </span>
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="space-y-4">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            Service
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-base font-semibold ${
                  hasService ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {resolvedServiceName ?? "-"}
              </p>
              <p
                className={`text-sm ${
                  hasDuration ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {resolvedServiceDuration ?? "-"}
              </p>
            </div>
            <p
              className={`text-base font-semibold ${
                hasServicePrice ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {resolvedServicePrice ?? "-"}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Separator className="mb-4 bg-border" />
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            Summary
          </p>
          {/* <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span
              className={hasTotalPrice ? "text-foreground" : "text-muted-foreground"}
            >
              {subtotalLabel}
            </span>
          </div> */}
          <div className="mt-4 flex items-center justify-between text-lg font-semibold text-foreground">
            <span>Total</span>
            <span className={hasTotalPrice ? "text-foreground" : "text-muted-foreground"}>
              {totalLabel}
            </span>
          </div>
        </div>

        {isReady ? (
          <Button
            asChild
            className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button
            className="w-full rounded-full bg-muted py-6 text-base font-semibold text-muted-foreground"
            disabled
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
