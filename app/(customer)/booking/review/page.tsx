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
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type BookingSearchParams = {
  serviceId?: string | string[];
  service?: string | string[];
  duration?: string | string[];
  price?: string | string[];
  total?: string | string[];
  date?: string | string[];
  time?: string | string[];
  barber?: string | string[];
  barberId?: string | string[];
  startAt?: string | string[];
  endAt?: string | string[];
  error?: string | string[];
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function ReviewBookingPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const serviceId = readParam(params.serviceId) ?? "";
  const bookingDate = readParam(params.date) ?? "-";
  const bookingTime = readParam(params.time) ?? "-";
  const barberName = readParam(params.barber) ?? "-";
  const barberId = readParam(params.barberId) ?? "";
  const serviceName = readParam(params.service) ?? "-";
  const serviceDuration = readParam(params.duration) ?? "-";
  const servicePrice = readParam(params.price) ?? "-";
  const totalPrice = readParam(params.total) ?? servicePrice ?? "-";
  const startAt = readParam(params.startAt) ?? "";
  const endAt = readParam(params.endAt) ?? "";
  const errorMessage =
    readParam(params.error) === "booking"
      ? "Unable to create booking. Please try again."
      : readParam(params.error) === "active"
      ? "You already have an active booking."
      : null;

  if (
    !readParam(params.service) ||
    !readParam(params.duration) ||
    !readParam(params.price) ||
    !readParam(params.serviceId)
  ) {
    redirect("/booking/services");
  }

  if (!barberId) {
    redirect(
      `/booking/barbers?service=${encodeURIComponent(
        readParam(params.service) ?? ""
      )}&duration=${encodeURIComponent(
        readParam(params.duration) ?? ""
      )}&price=${encodeURIComponent(
        readParam(params.price) ?? ""
      )}&serviceId=${encodeURIComponent(readParam(params.serviceId) ?? "")}`
    );
  }

  if (!startAt || !endAt) {
    redirect(
      `/booking/time?service=${encodeURIComponent(
        readParam(params.service) ?? ""
      )}&duration=${encodeURIComponent(
        readParam(params.duration) ?? ""
      )}&price=${encodeURIComponent(
        readParam(params.price) ?? ""
      )}&serviceId=${encodeURIComponent(
        readParam(params.serviceId) ?? ""
      )}&barber=${encodeURIComponent(
        readParam(params.barber) ?? ""
      )}&barberId=${encodeURIComponent(readParam(params.barberId) ?? "")}`
    );
  }

  const createBooking = async () => {
    "use server";

    const redirectWithError = (code: "booking" | "active") => {
      redirect(
        `/booking/review?service=${encodeURIComponent(
          serviceName
        )}&duration=${encodeURIComponent(
          serviceDuration
        )}&price=${encodeURIComponent(servicePrice)}&total=${encodeURIComponent(
          totalPrice
        )}&date=${encodeURIComponent(bookingDate)}&time=${encodeURIComponent(
          bookingTime
        )}&barber=${encodeURIComponent(
          barberName
        )}&barberId=${encodeURIComponent(
          barberId
        )}&serviceId=${encodeURIComponent(
          serviceId
        )}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(
          endAt
        )}&error=${code}`
      );
    };

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .limit(1)
      .maybeSingle();

    if (existingError) {
      redirectWithError("booking");
    }

    if (existingBooking) {
      redirectWithError("active");
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        barber_id: barberId,
        service_id: serviceId,
        start_at: startAt,
        end_at: endAt,
        status: "scheduled",
      })
      .select("id")
      .single();

    const bookingId = data?.id;

    if (error || !bookingId) {
      redirectWithError("booking");
    }

    redirect(`/booking/confirmed?bookingId=${bookingId}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-40">
      <div className="flex flex-col gap-4">
        <header className="space-y-4">
          <div className="lg:hidden">
            <BookingFlowActions backHref="/booking/time" />
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
                <BreadcrumbPage>Review</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-muted-foreground">Confirmed</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
              Review and confirm
            </h1>
          </div>
        </header>
      </div>

      <section className="">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative">
            {/* Header */}
            <div className="bg-primary px-5 py-4 text-primary-foreground">
              <p className="text-xs font-semibold tracking-[0.2em] text-primary-foreground/70">
                Booking Details
              </p>
              <p className="mt-2 text-lg font-semibold">{bookingDate}</p>
              <p className="mt-1 text-sm text-primary-foreground/70">
                {bookingTime}
              </p>
            </div>

            {/* Appointment */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                Appointment
              </p>

              <div className="mt-3 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <Calendar className="h-4 w-4" />
                </span>
                <p className="ml-3 text-base font-semibold text-foreground">
                  {bookingDate}
                </p>
              </div>

              <div className="mt-3 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <Clock className="h-4 w-4" />
                </span>
                <p className="ml-3 text-base font-semibold text-foreground">
                  {bookingTime}
                </p>
              </div>

              <div className="mt-3 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <User className="h-4 w-4" />
                </span>
                <p className="ml-3 text-base font-semibold text-foreground">
                  {barberName}
                </p>
              </div>
            </div>

            {/* Tear line (dashed) + notches */}
            <div className="relative">
              <div className="h-px border-t border-dashed border-border" />
              <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-border bg-muted" />
              <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-border bg-muted" />
            </div>

            {/* Service */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                Service
              </p>

              <div className="mt-3 flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="truncate text-base font-semibold text-foreground">
                    {serviceName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {serviceDuration}
                  </p>
                </div>

                <p className="shrink-0 text-base font-semibold text-foreground">
                  {servicePrice}
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Summary */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                Summary
              </p>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">Total</p>
                <p className="text-lg font-semibold text-foreground">
                  {totalPrice}
                </p>
              </div>
            </div>

            {errorMessage ? (
              <p className="px-5 pb-4 text-sm font-medium text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="fixed bottom-4 left-1/2 z-20 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 lg:bottom-6">
        <div className="text-card-foreground flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/90 shadow-none backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="space-y-1 py-2">
              <p className="text-sm font-semibold text-foreground">
                {totalPrice}
              </p>
              <p className="text-xs text-muted-foreground">
                1 service · {serviceDuration}
              </p>
            </div>
            <form action={createBooking}>
              <Button className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Confirm
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
