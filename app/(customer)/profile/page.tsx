import {
  Calendar,
  Clock,
  LogOut,
  Scissors,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type HistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  serviceName: string;
  barberName: string;
  price: number | null;
  status: "completed" | "cancelled";
};

type BookingRecord = {
  id: string;
  start_at: string;
  end_at: string;
  created_at: string;
  status: "completed" | "cancelled";
  service: {
    name: string | null;
    price: number | null;
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

const logout = async () => {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};

export default async function ProfilePage() {
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
      .select("first_name,last_name,email,phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id,start_at,end_at,created_at,status,service:service_id (name, price), barber:barber_id (display_name, first_name, last_name)"
      )
      .eq("customer_id", user.id)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false })
      .returns<BookingRecord[]>(),
  ]);

  const profile: Profile = {
    id: user.id,
    first_name: profileData?.first_name ?? null,
    last_name: profileData?.last_name ?? null,
    email: profileData?.email ?? user.email ?? null,
    phone: profileData?.phone ?? null,
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
      price: booking.service?.price ?? null,
      status: booking.status,
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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl text-slate-900 lg:text-4xl">
            Profile
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">Customize your profile</p>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </form>
      </header>

      <section className="rounded-3xl bg-slate-900 p-5 text-white">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16  items-center justify-center rounded-full bg-slate-200 text-slate-900">
            <span className="text-2xl font-semibold">{initials || "?"}</span>
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold">
              {fullName || "Your Profile"}
            </p>
            <p className="mt-1 text-base text-slate-200">
              {profile.email ?? "—"}
            </p>
          </div>
          {/* <Button
            type="button"
            variant="secondary"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            disabled
          >
            Edit
          </Button> */}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">
            Booking History
          </p>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {completedVisits} visits
          </span>
        </div>

        <div className="rounded-3xl bg-slate-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Recent visits</p>
              <p className="mt-1 text-sm text-slate-300">
                Track completed and cancelled appointments
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Clock className="h-5 w-5 text-slate-200" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-10 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-200" />
                <p className="mt-3 text-sm text-slate-300">
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
                    : `${timeFormatter.format(
                        startDate
                      )} - ${timeFormatter.format(endDate)}`;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">
                        {item.serviceName}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {dateLabel} · {timeLabel}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {item.barberName}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.price ? `RM${item.price}` : "RM0"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
