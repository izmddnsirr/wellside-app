import { Check, Hammer, User } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BookingConfirmedPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-16">
      <div className="flex flex-col gap-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
            Booking confirmed
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">
            We&apos;ve locked in your slot. See you soon.
          </p>
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
            <BreadcrumbLink asChild>
              <Link href="/booking/review">Review</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Confirmed</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section
        className=""
        style={{ animationDelay: "80ms" }}
      >
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm overflow-hidden rounded-3xl border-slate-200/80 bg-white/85 shadow-none">
          <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 flex flex-row items-start justify-between bg-slate-900 py-6 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-300">
                Confirmed
              </p>
              <p className="mt-3 text-xl font-semibold">Sunday, Jan 18</p>
              <p className="mt-1 text-sm text-slate-300">9:00 PM - 10:00 PM</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
              <Check className="h-5 w-5" />
            </span>
          </div>

          <div className="px-6 py-6">
            <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
              Appointment
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  Ikhwan Nasir
                </p>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Hammer className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">Cut</p>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-sm font-semibold">45</span>
                </span>
                <p className="text-base font-semibold text-slate-900">45 min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Button
        asChild
        size="lg"
        className="mt-auto h-14 rounded-full bg-slate-900 px-6 text-base font-semibold text-white hover:bg-slate-900/90"
        style={{ animationDelay: "160ms" }}
      >
        <Link href="/booking">Done</Link>
      </Button>
    </div>
  );
}
