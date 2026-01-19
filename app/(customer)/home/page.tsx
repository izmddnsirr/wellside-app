import {
  Calendar,
  CalendarCheck,
  Clock,
  Scissors,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

type BookingRecord = {
  start_at: string;
  status: "scheduled" | "in_progress";
  service: {
    name: string | null;
  } | null;
  barber: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [
    { data: profileData },
    { data: bookingData },
    { count: totalBookings },
  ] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select(
            "start_at,status,service:service_id (name),barber:barber_id (display_name, first_name, last_name)"
          )
          .eq("customer_id", user.id)
          .in("status", ["scheduled", "in_progress"])
          .order("start_at", { ascending: true })
          .limit(1)
          .maybeSingle()
          .returns<BookingRecord>(),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id),
      ])
    : [{ data: null }, { data: null }, { count: 0 }];
  const firstName = profileData?.first_name ?? null;
  const upcoming = bookingData ?? null;
  const bookingDay = upcoming?.start_at
    ? dayFormatter.format(new Date(upcoming.start_at))
    : "None";
  const bookingTime = upcoming?.start_at
    ? timeFormatter.format(new Date(upcoming.start_at))
    : "";
  const barberName =
    upcoming?.barber?.display_name?.trim() ||
    [upcoming?.barber?.first_name, upcoming?.barber?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Barber";
  const serviceName = upcoming?.service?.name ?? "Service";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl text-slate-900 lg:text-4xl">
            Hi{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">
            Clean lines. Calm day.
          </p>
        </div>
      </header>

      <div className="grid gap-4">
        <div className="flex flex-col gap-6">
          <div
            className="relative flex flex-col gap-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white"
            style={{ animationDelay: "80ms" }}
          >
          
            <div className="bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-300">
                  Upcoming
                </p>
                {upcoming ? (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      upcoming.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {upcoming.status === "in_progress"
                      ? "IN PROGRESS"
                      : "SCHEDULED"}
                  </span>
                ) : null}
              </div>
              {upcoming ? (
                <>
                  <p className="mt-3 text-3xl font-semibold">{bookingDay}</p>
                  <p className="text-lg text-slate-200">
                    {bookingTime} · {serviceName}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-2xl font-semibold">
                    No upcoming booking
                  </p>
                  <p className="mt-2 text-base text-slate-200">
                    Book a slot to see it here.
                  </p>
                </>
              )}
            </div>
            {upcoming ? (
              <div className="px-6 py-5">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <Scissors className="h-3.5 w-3.5" />
                      Service
                    </div>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      Barber
                    </div>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {barberName}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="mt-5 w-full rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  <Link href="/booking">
                    <Calendar className="h-4 w-4" />
                    Manage booking
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="px-6 py-5">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-900/90"
                >
                  <Link href="/booking">
                    <CalendarCheck className="h-4 w-4" />
                    Start booking
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <section
            className="grid grid-cols-3 gap-3"
            style={{ animationDelay: "160ms" }}
          >
            <div className="text-card-foreground flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Next
              </div>
              <div className="mt-3 text-base font-semibold leading-none text-slate-900">
                {upcoming ? bookingTime : "None"}
              </div>
              <div className="text-sm text-slate-400">
                {upcoming ? bookingDay : "Book now"}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Total
              </div>
              <div className="mt-3 text-base font-semibold leading-none text-slate-900">
                {totalBookings ?? 0}
              </div>
              <div className="text-sm text-slate-400">
                Bookings
              </div>
            </div>
            <Link
              href="/ai"
              className="flex flex-col gap-3 rounded-3xl border border-transparent bg-slate-900 px-4 py-4 text-white"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Try AI
              </div>
              <div className="mt-3 text-base font-semibold leading-none text-white">
                Suggest
              </div>
              <div className="text-sm text-slate-300">New look</div>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
