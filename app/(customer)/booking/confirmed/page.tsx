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
import { Button } from "@/components/ui/button";
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatTimeRange = (startAt: string, endAt: string) => {
  const formatter = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(startAt))} - ${formatter.format(
    new Date(endAt)
  )}`;
};

type BookingSearchParams = {
  bookingId?: string | string[];
};

type BookingRecord = {
  id: string;
  start_at: string;
  end_at: string;
  booking_ref: string | null;
  customer_id: string;
  service: {
    name: string | null;
    duration_minutes: number | null;
  } | null;
  barber: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const bookingId = readParam(params.bookingId);

  if (!bookingId) {
    redirect("/booking");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, start_at, end_at, booking_ref, customer_id, service:service_id (name, duration_minutes), barber:barber_id (display_name, first_name, last_name)"
    )
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .maybeSingle()
    .returns<BookingRecord>();

  if (error || !booking) {
    redirect("/booking");
  }

  const barberLabel =
    booking.barber?.display_name?.trim() ||
    [booking.barber?.first_name, booking.barber?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "-";
  const serviceLabel = booking.service?.name ?? "-";
  const durationLabel = booking.service?.duration_minutes
    ? `${booking.service.duration_minutes} min`
    : "-";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-16">
      <div className="flex flex-col gap-4">
        <header className="space-y-4">
          <div className="lg:hidden">
            <BookingFlowActions backHref="/booking/review" />
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
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
              Booking confirmed
            </h1>
            <p className="text-sm text-slate-500 lg:text-base">
              We&apos;ve locked in your slot. See you soon.
            </p>
          </div>
        </header>
      </div>

      <section
        className=""
        style={{ animationDelay: "80ms" }}
      >
        <div className=" text-card-foreground flex flex-col gap-6 border  overflow-hidden rounded-3xl border-slate-200/80 bg-white/85 shadow-none">
          <div className="@container/card-header  auto-rows-min grid-rows-[auto_auto]  gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 flex flex-row items-start justify-between bg-slate-900 py-6 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-300">
                Confirmed
              </p>
              <p className="mt-3 text-xl font-semibold">
                {formatDate(booking.start_at)}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {formatTimeRange(booking.start_at, booking.end_at)}
              </p>
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
                  {barberLabel}
                </p>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <Hammer className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {serviceLabel}
                </p>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-sm font-semibold">
                    {booking.service?.duration_minutes ?? "-"}
                  </span>
                </span>
                <p className="text-base font-semibold text-slate-900">
                  {durationLabel}
                </p>
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
