import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const getDisplayName = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.first_name ?? user.email ?? null;
};

const logout = async () => {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
};

export default async function HomePage() {
  const displayName = await getDisplayName();

  return (
    <div className="min-h-svh bg-[#f2efe8] text-[#1c1a16]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#e1d8c9] bg-white px-6 py-5 shadow-[0_16px_30px_rgba(28,26,22,0.08)]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6a6156]">
              Customer home
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {displayName ? `Hi ${displayName}, ready for your next cut?` : "Welcome to Wellside"}
            </h1>
            <p className="mt-1 text-sm text-[#4f463b]">
              Your bookings, preferences, and perks in one place.
            </p>
          </div>
          {displayName ? (
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-[#1c1a16] px-5 py-2 text-sm font-semibold"
              >
                Logout
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[#1c1a16] px-5 py-2 text-sm font-semibold"
            >
              Login
            </Link>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="grid gap-6">
            <div className="rounded-3xl border border-[#e1d8c9] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6a6156]">
                    Upcoming appointment
                  </p>
                  <h2 className="text-2xl font-semibold">No booking yet</h2>
                  <p className="mt-1 text-sm text-[#6a6156]">
                    Save a slot and we will keep your schedule clear.
                  </p>
                </div>
                <Link
                  href="/barber"
                  className="rounded-full bg-[#1c1a16] px-5 py-2 text-sm font-semibold text-white"
                >
                  Book now
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Today 4:00 PM", "Tomorrow 11:30 AM", "Sat 2:15 PM", "Sun 5:40 PM"].map(
                  (slot) => (
                    <button
                      key={slot}
                      className="flex items-center justify-between rounded-2xl border border-[#efe5d7] bg-[#faf6f0] px-4 py-3 text-sm font-medium"
                    >
                      <span>{slot}</span>
                      <span className="text-[#7b7267]">Hold</span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-[#e1d8c9] bg-white p-6 md:grid-cols-3">
              {[
                { label: "Loyalty points", value: "120 pts" },
                { label: "Visits this month", value: "2" },
                { label: "Saved barbers", value: "5" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#efe5d7] bg-[#faf6f0] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7b7267]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-[#1c1a16] bg-[#1c1a16] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-[#cfc6bb]">
                Recommendations
              </p>
              <h2 className="mt-4 text-2xl font-semibold">
                Try a new style this week.
              </h2>
              <p className="mt-2 text-sm text-[#d6cdc2]">
                Fresh fades and beard trims with 10% member savings.
              </p>
              <div className="mt-5 space-y-3">
                {["Modern fade + beard", "Classic scissor cut", "Texture cleanup"].map(
                  (service) => (
                    <div
                      key={service}
                      className="flex items-center justify-between rounded-2xl border border-[#36312a] bg-[#2a2621] px-4 py-3 text-sm"
                    >
                      <span>{service}</span>
                      <span className="text-[#cfc6bb]">RM45+</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e1d8c9] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#6a6156]">
                Saved barbers
              </p>
              <div className="mt-4 space-y-3">
                {["Rafiq Studio", "Clip Corner", "Waves & Co."].map((barber) => (
                  <div
                    key={barber}
                    className="flex items-center justify-between rounded-2xl border border-[#efe5d7] bg-[#faf6f0] px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{barber}</span>
                    <Link href="/barber" className="text-[#7b7267]">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
