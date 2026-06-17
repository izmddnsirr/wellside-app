import { Suspense } from "react";
import {
  Calendar,
  CalendarCheck,
  Clock,
  RefreshCw,
  Scissors,
  Star,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";
import {
  BookingPageTransition,
  BookingStaggerList,
  BookingStaggerItem,
} from "@/components/customer/booking-motion";

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

type BarberRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  barber_level: string | null;
};

type LastVisitRow = {
  start_at: string;
  service_id: string;
  barber_id: string;
};

type ReviewRow = {
  barber_id: string;
  rating: number;
};

type Barber = {
  id: string;
  name: string;
  level: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reviewCount: number;
};

type LastVisit = {
  startAt: string;
  serviceName: string;
  serviceId: string;
  barberName: string;
  barberId: string;
};

const getDaysSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatDaysAgo = (dateStr: string) => {
  const days = getDaysSince(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
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

async function HomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [
    { data: profileData },
    { data: bookingData },
    { count: totalBookings },
    { data: barberData },
    { data: reviewData },
    { data: lastVisitData },
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
        supabase
          .from("profiles")
          .select("id,display_name,first_name,last_name,avatar_url,barber_level")
          .eq("role", "barber")
          .eq("is_active", true)
          .returns<BarberRow[]>(),
        supabase
          .from("barber_reviews")
          .select("barber_id,rating")
          .returns<ReviewRow[]>(),
        supabase
          .from("bookings")
          .select("start_at,service_id,barber_id")
          .eq("customer_id", user.id)
          .eq("status", "completed")
          .order("start_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .returns<LastVisitRow>(),
      ])
    : [
        { data: null },
        { data: null },
        { count: 0 },
        { data: null },
        { data: null },
        { data: null },
      ];
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

  const reviewsByBarber = (reviewData ?? []).reduce<Record<string, number[]>>(
    (acc, r) => {
      if (!acc[r.barber_id]) acc[r.barber_id] = [];
      acc[r.barber_id].push(r.rating);
      return acc;
    },
    {},
  );

  const barbers: Barber[] = (barberData ?? []).map((b) => {
    const ratings = reviewsByBarber[b.id] ?? [];
    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : null;
    return {
      id: b.id,
      name:
        b.display_name?.trim() ||
        [b.first_name, b.last_name].filter(Boolean).join(" ").trim() ||
        "Barber",
      level: b.barber_level ?? null,
      avatarUrl: b.avatar_url ?? null,
      rating: avg,
      reviewCount: ratings.length,
    };
  });

  let lastVisit: LastVisit | null = null;
  if (lastVisitData) {
    const [{ data: lvService }, { data: lvBarber }] = await Promise.all([
      supabase
        .from("services")
        .select("name")
        .eq("id", lastVisitData.service_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name,first_name,last_name")
        .eq("id", lastVisitData.barber_id)
        .maybeSingle(),
    ]);
    lastVisit = {
      startAt: lastVisitData.start_at,
      serviceName: lvService?.name ?? "Service",
      serviceId: lastVisitData.service_id,
      barberName:
        lvBarber?.display_name?.trim() ||
        [lvBarber?.first_name, lvBarber?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Barber",
      barberId: lastVisitData.barber_id,
    };
  }

  return (
    <>
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
            Hi{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base">
            Clean lines. Calm day.
          </p>
        </div>
      </header>

      <div className="grid gap-4">
        <BookingStaggerList className="flex flex-col gap-6">
          <BookingStaggerItem>
          <div
            className="relative flex flex-col gap-0 overflow-hidden rounded-3xl border border-border/60 bg-card"
          >

            <div className="bg-primary px-6 py-5 text-primary-foreground">
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-foreground/70">
                  Upcoming
                </p>
                {upcoming ? (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      upcoming.status === "in_progress"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
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
                  <p className="text-lg text-primary-foreground/80">
                    {bookingTime} · {serviceName}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-2xl font-semibold">
                    No upcoming booking
                  </p>
                  <p className="mt-2 text-base text-primary-foreground/80">
                    Book a slot to see it here.
                  </p>
                </>
              )}
            </div>
            {upcoming ? (
              <div className="px-6 py-5">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Scissors className="h-3.5 w-3.5" />
                      Service
                    </div>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {serviceName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Barber
                    </div>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {barberName}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="mt-5 w-full rounded-full border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted"
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
                  className="w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/booking">
                    <CalendarCheck className="h-4 w-4" />
                    Start booking
                  </Link>
                </Button>
              </div>
            )}
          </div>
          </BookingStaggerItem>

          <BookingStaggerItem>
          <section className="grid grid-cols-2 gap-3">
            <div className="text-card-foreground flex flex-col gap-3 rounded-3xl border border-border/60 bg-card px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Next
              </div>
              <div className="mt-3 text-base font-semibold leading-none text-foreground">
                {upcoming ? bookingTime : "None"}
              </div>
              <div className="text-sm text-muted-foreground">
                {upcoming ? bookingDay : "Book now"}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Total
              </div>
              <div className="mt-3 text-base font-semibold leading-none text-foreground">
                {totalBookings ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Bookings</div>
            </div>
          </section>
          </BookingStaggerItem>

          {barbers.length > 0 && (
            <BookingStaggerItem>
              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  Meet the barbers
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {barbers.map((barber) => (
                    <Link
                      key={barber.id}
                      href={`/booking/barbers?barberId=${barber.id}`}
                      className="flex flex-col items-center rounded-3xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/50"
                    >
                      {barber.avatarUrl ? (
                        <Image
                          src={barber.avatarUrl}
                          alt={barber.name}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full border-2 border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-muted">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="mt-3 text-center text-sm font-semibold text-foreground truncate max-w-full">
                        {barber.name}
                      </p>
                      {barber.level && (
                        <p className="mt-0.5 text-center text-xs text-muted-foreground">
                          {barber.level}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1">
                        <Star
                          className={`h-3 w-3 ${barber.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {barber.rating ? barber.rating.toFixed(1) : "—"}
                        </span>
                        {barber.reviewCount > 0 && (
                          <span className="text-xs text-muted-foreground/70">
                            ({barber.reviewCount})
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </BookingStaggerItem>
          )}

          {lastVisit && (
            <BookingStaggerItem>
              <section>
                <h2 className="text-lg font-semibold text-foreground">
                  Last visit
                </h2>
                <div className="mt-3 rounded-3xl border border-border/60 bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatDaysAgo(lastVisit.startAt)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {lastVisit.serviceName}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      with {lastVisit.barberName}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="mt-4 w-full rounded-full"
                  >
                    <Link
                      href={`/booking?serviceId=${lastVisit.serviceId}&barberId=${lastVisit.barberId}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Book again
                    </Link>
                  </Button>
                </div>
              </section>
            </BookingStaggerItem>
          )}
        </BookingStaggerList>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <header className="space-y-2">
        <div className="space-y-1">
          <Skeleton className="h-9 w-36 lg:h-10" />
          <Skeleton className="h-4 w-32 lg:h-5" />
        </div>
      </header>
      <div className="grid gap-4">
        <div className="flex flex-col gap-6">
          {/* Booking card */}
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
            <div className="bg-primary/20 px-6 py-5 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-52" />
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3 w-14 ml-auto" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-border/60 bg-card px-4 py-4 flex flex-col gap-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-5 w-16 mt-3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card px-4 py-4 flex flex-col gap-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-5 w-8 mt-3" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          {/* Barbers */}
          <div>
            <Skeleton className="h-5 w-36" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center rounded-3xl border border-border/60 bg-card p-4 gap-3">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
          {/* Last visit */}
          <div>
            <Skeleton className="h-5 w-20" />
            <div className="mt-3 rounded-3xl border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <BookingPageTransition className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </BookingPageTransition>
  );
}
