import { Suspense } from "react";
import {
  Calendar,
  Clock,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  BookingPageTransition,
  BookingStaggerList,
  BookingStaggerItem,
} from "@/components/customer/booking-motion";
import { ProfileAvatarSection } from "./profile-avatar-section";
import { ReviewDialog } from "./review-dialog";
import { StarRating } from "@/components/ui/star-rating";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type HistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  serviceName: string;
  barberName: string;
  barberId: string | null;
  price: number | null;
  status: "completed" | "cancelled" | "no_show";
  review: { rating: number; comment: string | null } | null;
};

type BookingRecord = {
  id: string;
  start_at: string;
  end_at: string;
  created_at: string;
  status: "completed" | "cancelled" | "no_show";
  barber_id: string | null;
  service: {
    name: string | null;
    base_price: number | null;
  } | null;
  barber: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "RM0.00";
  }
  return `RM${new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

const formatStatusLabel = (status: "completed" | "cancelled" | "no_show") =>
  status.replace(/_/g, " ").toUpperCase();

const logout = async () => {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

async function ProfileContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profileData }, { data: bookingData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name,last_name,email,phone,avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id,start_at,end_at,created_at,status,barber_id,service:service_id (name, base_price), barber:barber_id (display_name, first_name, last_name)"
      )
      .eq("customer_id", user.id)
      .in("status", ["completed", "cancelled", "no_show"])
      .order("created_at", { ascending: false })
      .returns<BookingRecord[]>(),
  ]);

  const bookingIds = (bookingData ?? []).map((b) => b.id);
  const { data: reviewData } = bookingIds.length > 0
    ? await supabase
        .from("barber_reviews")
        .select("booking_id, rating, comment")
        .in("booking_id", bookingIds)
    : { data: [] };

  const reviewMap = new Map(
    (reviewData ?? []).map((r) => [r.booking_id, { rating: r.rating, comment: r.comment }])
  );

  const profile: Profile = {
    id: user.id,
    first_name: profileData?.first_name ?? null,
    last_name: profileData?.last_name ?? null,
    email: profileData?.email ?? user.email ?? null,
    phone: profileData?.phone ?? null,
    avatar_url: profileData?.avatar_url ?? null,
  };
  const history: HistoryItem[] = (bookingData ?? []).map((booking) => {
    const barberName =
      booking.barber?.display_name?.trim() ||
      [booking.barber?.first_name, booking.barber?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Barber";

    return {
      id: booking.id,
      startAt: booking.start_at,
      endAt: booking.end_at,
      createdAt: booking.created_at,
      serviceName: booking.service?.name ?? "Service",
      barberName,
      barberId: booking.barber_id ?? null,
      price: booking.service?.base_price ?? null,
      status: booking.status,
      review: reviewMap.get(booking.id) ?? null,
    };
  });
  const completedVisits = history.filter(
    (item) => item.status === "completed"
  ).length;
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${profile.first_name?.[0] ?? ""}${
    profile.last_name?.[0] ?? ""
  }`.toUpperCase();

  return (
    <BookingStaggerList className="contents">
      <BookingStaggerItem>
        <ProfileAvatarSection
          uid={profile.id}
          url={profile.avatar_url}
          initials={initials || "?"}
          fullName={fullName}
          email={profile.email ?? ""}
        />
      </BookingStaggerItem>

      <BookingStaggerItem>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-foreground">
            Booking History
          </p>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
            {completedVisits} visits
          </span>
        </div>
        <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Recent visits</p>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Track your appointments history
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10">
              <Clock className="h-5 w-5 text-primary-foreground/70" />
            </div>
          </div>
          <BookingStaggerList className="mt-5 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-6 py-10 text-center">
                <Calendar className="mx-auto h-8 w-8 text-primary-foreground/70" />
                <p className="mt-3 text-sm text-primary-foreground/70">
                  No visits yet. Your next booking will show up here.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const startDate = new Date(item.startAt);
                const endDate = new Date(item.endAt);
                const dateLabel = Number.isNaN(startDate.getTime())
                  ? "Date unavailable"
                  : dateFormatter.format(startDate);
                const timeLabel =
                  Number.isNaN(startDate.getTime()) ||
                  Number.isNaN(endDate.getTime())
                    ? "Time unavailable"
                    : `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;

                return (
                  <BookingStaggerItem key={item.id}>
                  <div className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">{item.serviceName}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : item.status === "no_show"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateLabel} · {timeLabel}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {item.barberName}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.status === "completed" && (
                      <div className="mt-2 pt-2 border-t border-border/60">
                        {item.review ? (
                          <div className="flex items-center gap-2">
                            <StarRating value={item.review.rating} readonly size={13} />
                            {item.review.comment && (
                              <p className="text-xs text-muted-foreground truncate">{item.review.comment}</p>
                            )}
                          </div>
                        ) : item.barberId ? (
                          <ReviewDialog
                            bookingId={item.id}
                            barberId={item.barberId}
                            barberName={item.barberName}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                  </BookingStaggerItem>
                );
              })
            )}
          </BookingStaggerList>
        </div>
      </section>
      </BookingStaggerItem>
    </BookingStaggerList>
  );
}

function ProfileSkeleton() {
  return (
    <>
      {/* Profile header card */}
      <section className="rounded-3xl bg-primary/20 p-5">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
        </div>
      </section>

      {/* Booking History section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="rounded-3xl bg-primary/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-background/60 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48 max-w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function ProfilePage() {
  return (
    <BookingPageTransition className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground lg:text-base">
            Customized your profile
          </p>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </form>
      </header>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </BookingPageTransition>
  );
}
