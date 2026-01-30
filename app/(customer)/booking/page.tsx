import { Calendar, CalendarCheck, Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/server";
import {
  buildBookingCancellationPayload,
  sendBookingCancellationEmailTo,
} from "@/utils/email/booking-cancellation";
import { redirect } from "next/navigation";

const TIME_ZONE = "Asia/Kuala_Lumpur";
const DEFAULT_DIRECTIONS_URL =
  "https://maps.app.goo.gl/qt9QgpidbmVmrMoy6?g_st=ipc";
const DEFAULT_WHATSAPP_PHONE = "01112564440";

type BookingSearchParams = {
  error?: string | string[];
};

type BookingRecord = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  service: {
    name: string | null;
    base_price: number | null;
    duration_minutes: number | null;
  } | null;
  barber: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "RM0.00";
  }
  return `RM${new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

const formatTimeRange = (startAt: string, endAt: string) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }
  return `${timeFormatter.format(start)} · ${timeFormatter.format(end)}`;
};

const cancelBooking = async (formData: FormData) => {
  "use server";

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) {
    redirect("/booking");
  }

  const supabase = await createClient();
  const { data: bookingDetails, error: bookingDetailsError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_ref,
      start_at,
      end_at,
      booking_date,
      customer:customer_id (first_name, last_name, email, phone),
      barber:barber_id (display_name, first_name, last_name),
      service:service_id (name, base_price)
    `
    )
    .eq("id", bookingId)
    .single();
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    redirect("/booking?error=cancel");
  }

  try {
    if (bookingDetailsError || !bookingDetails) {
      console.error("Failed to load booking details for cancellation email", {
        bookingId,
        bookingDetailsError,
      });
    } else {
      const payload = buildBookingCancellationPayload(bookingDetails);
      if (!payload) {
        console.error("Missing customer email for booking cancellation", {
          bookingId,
        });
      } else {
        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        sendOps.push(
          sendBookingCancellationEmailTo(
            payload,
            payload.customerEmail,
            "Customer"
          )
        );

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingCancellationEmailTo(payload, adminEmails, "Admin")
          );
        } else {
          console.error("Missing admin emails for booking cancellation");
        }

        await Promise.allSettled(sendOps);
      }
    }
  } catch (emailError) {
    console.error("Failed to send booking cancellation email", emailError);
  }

  redirect("/booking");
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const errorMessage =
    readParam(params.error) === "cancel"
      ? "Unable to cancel booking. Please try again."
      : null;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="space-y-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
              Booking
            </h1>
            <p className="text-sm text-muted-foreground lg:text-base">
              Choose your chair now
            </p>
          </div>
        </header>
        <section className="space-y-4" style={{ animationDelay: "80ms" }}>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            Upcoming
          </p>
          <div className="border border-border/60 bg-card/85">
            <div className="p-4">
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Please sign in to view your booking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, start_at, end_at, status, service:service_id (name, base_price, duration_minutes), barber:barber_id (display_name, first_name, last_name, phone)"
    )
    .eq("customer_id", user.id)
    .in("status", ["scheduled", "in_progress"])
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .returns<BookingRecord>();

  const hasBooking = Boolean(booking && !bookingError);
  const barberLabel =
    booking?.barber?.display_name?.trim() ||
    [booking?.barber?.first_name, booking?.barber?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Barber";
  const timeLabel = booking
    ? formatTimeRange(booking.start_at, booking.end_at)
    : "";
  const dayLabel = booking?.start_at
    ? dayFormatter.format(new Date(booking.start_at)).toUpperCase()
    : "";
  const durationLabel = booking?.service?.duration_minutes
    ? `${booking.service.duration_minutes} min`
    : "N/A";
  const priceLabel = formatCurrency(booking?.service?.base_price);
  const statusLabel =
    booking?.status === "in_progress" ? "IN PROGRESS" : "SCHEDULED";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
            Booking
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base">
            Choose your chair now
          </p>
        </div>
      </header>
      <section className="space-y-4" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
            Upcoming
          </p>
          {hasBooking ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                booking?.status === "in_progress"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
              }`}
            >
              {statusLabel}
            </span>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          {!hasBooking ? (
            <div className="p-4">
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {bookingError
                    ? "Unable to load your upcoming booking."
                    : "No upcoming bookings yet."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-primary px-6 py-6 text-primary-foreground">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-[11px] tracking-[0.2em] text-primary-foreground/70">
                      {dayLabel}
                    </p>
                    <p className="text-2xl font-semibold">{timeLabel}</p>
                    <p className="text-sm text-primary-foreground/70">
                      {booking?.service?.name ?? "Service"} · {barberLabel}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/10">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="space-y-6 px-6 py-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
                        Duration
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {durationLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                      <span className="text-xs font-semibold">RM</span>
                    </span>
                    <div>
                      <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
                        Total
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {priceLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full border border-destructive/30 bg-destructive/10 py-6 text-sm font-semibold text-destructive hover:bg-destructive/20">
                      Cancel booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Cancel this booking?
                      </DialogTitle>
                      <DialogDescription>
                        You can cancel up to 2 hours before your appointment.
                        After that, please contact your barber.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Keep booking
                        </Button>
                      </DialogClose>
                      <form action={cancelBooking}>
                        <input
                          type="hidden"
                          name="booking_id"
                          value={booking?.id}
                        />
                        <Button
                          type="submit"
                          variant="destructive"
                        >
                          Yes, cancel
                        </Button>
                      </form>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground text-center">
                  You can cancel up to 2 hours before your appointment. After
                  that, please contact your barber.
                </p>
              </div>
            </>
          )}
        </div>
        {hasBooking ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-border bg-background py-6 text-sm font-semibold text-foreground"
            >
              <a href={DEFAULT_DIRECTIONS_URL} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" />
                Get direction
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-border bg-background py-6 text-sm font-semibold text-foreground"
            >
              <a
                href={`https://wa.me/${DEFAULT_WHATSAPP_PHONE.replace(
                  /\\D/g,
                  ""
                )}?text=${encodeURIComponent(
                  "Hi! I have a question about my booking."
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Phone className="h-4 w-4" />
                Contact
              </a>
            </Button>
          </div>
        ) : null}
      </section>
      {errorMessage ? (
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Unable to cancel booking
              </DialogTitle>
              <DialogDescription>
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="destructive">Okay</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <section className="space-y-4" style={{ animationDelay: "160ms" }}>
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
          Quick Pick
        </p>
        <Button
          asChild
          size="lg"
          className="h-16 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/booking/services">Book appointment</Link>
        </Button>
      </section>
    </div>
  );
}
