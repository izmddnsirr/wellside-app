import { Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type BookingSearchParams = {
  service?: string | string[];
  duration?: string | string[];
  price?: string | string[];
  total?: string | string[];
  date?: string | string[];
  time?: string | string[];
  barber?: string | string[];
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function ReviewBookingPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const bookingDate = readParam(params.date) ?? "-";
  const bookingTime = readParam(params.time) ?? "-";
  const barberName = readParam(params.barber) ?? "-";
  const serviceName = readParam(params.service) ?? "-";
  const serviceDuration = readParam(params.duration) ?? "-";
  const servicePrice = readParam(params.price) ?? "-";
  const totalPrice = readParam(params.total) ?? servicePrice ?? "-";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-40">
      <div className="flex flex-col gap-4">
        <header className="space-y-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
              Review and confirm
            </h1>
          </div>
        </header>
      </div>
      <Breadcrumb className="">
        <BreadcrumbList className="text-xs">
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
            <BreadcrumbLink asChild>
              <Link href="/booking/time">Time</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Review</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section
        className=""
        style={{ animationDelay: "80ms" }}
      >
        <div className="text-card-foreground flex flex-col gap-6 border overflow-hidden rounded-3xl border-slate-200/80 bg-white/85">
          <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 bg-slate-900 py-6 text-white">
            <p className="text-[11px] uppercase tracking-[0.45em] text-slate-300">
              Booking Details
            </p>
            <p className="mt-3 text-xl font-semibold">{bookingDate}</p>
            <p className="mt-1 text-sm text-slate-300">{bookingTime}</p>
          </div>

          <div className="px-6 py-6">
            <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
              Appointment
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Calendar className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {bookingDate}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Clock className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {bookingTime}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <User className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {barberName}
                </p>
              </div>
            </div>

            <div className="relative my-6 border-t border-dashed border-slate-200">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-[#f4f6fb]" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-[#f4f6fb]" />
            </div>

            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
                Service
              </p>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {serviceName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {serviceDuration}
                  </p>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  {servicePrice}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5">
              <Separator className="mb-5 bg-slate-200" />
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
                Summary
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{totalPrice}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{totalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-24 left-1/2 z-20 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 lg:bottom-6">
        <div className="text-card-foreground flex flex-col gap-6 border py-6 rounded-3xl border-slate-200/70 bg-white/90 shadow-none backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {totalPrice}
              </p>
              <p className="text-xs text-slate-500">
                1 service · {serviceDuration}
              </p>
            </div>
            <Button
              asChild
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900/90"
            >
              <Link href="/booking/confirmed">Confirm</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
