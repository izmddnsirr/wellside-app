import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { House, MapPin } from "lucide-react";
import { HomeAvailability } from "@/components/customer/home-availability";
import { createClient } from "@/utils/supabase/server";
import ColorBends from "@/components/ColorBends";
import { redirect } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const fontVars = {
  "--font-display": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  "--font-body": '"Instrument Sans", ui-sans-serif, system-ui, sans-serif',
} as React.CSSProperties;

type Service = {
  id: string;
  name: string;
  base_price: number | null;
  duration_minutes: number | null;
};

const formatServicePrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return `RM${new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

const formatServiceDuration = (value: number | null) => {
  if (!value || Number.isNaN(value)) {
    return "-";
  }
  return `${value} min`;
};

type BarberOption = {
  id: string;
  name: string;
};

export default async function CustomerHome() {
  const supabase = await createClient();
  const logout = async () => {
    "use server";
    const authClient = await createClient();
    await authClient.auth.signOut();
    redirect("/");
  };
  const currentYear = new Date().getFullYear();
  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, base_price, duration_minutes")
    .eq("is_active", true)
    .not("base_price", "is", null)
    .order("created_at", { ascending: false });
  const services = servicesData ?? [];
  const { data: barbersData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name")
    .eq("is_active", true)
    .eq("role", "barber")
    .order("display_name");
  const barbers: BarberOption[] = (barbersData ?? []).map((barber) => {
    const name =
      barber.display_name?.trim() ||
      [barber.first_name, barber.last_name].filter(Boolean).join(" ").trim() ||
      "Barber";

    return {
      id: barber.id,
      name,
    };
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const displayName =
    userProfile?.display_name?.trim() ||
    [userProfile?.first_name, userProfile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.email?.split("@")[0] ||
    "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");
  const userHomeHref = "/home";
  const avatarUrl = userProfile?.avatar_url?.trim() || null;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background font-(--font-body) text-foreground"
      style={fontVars}
    >
      {/* ── HERO + NAV (shared ColorBends background) ──────────────────────── */}
      <div className="relative">
        {/* ColorBends full-bleed background */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <ColorBends
            colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
            rotation={0}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.1}
            transparent
            autoRotate={0}
          />
        </div>

        {/* Bottom fade into background */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48 bg-linear-to-t from-background to-transparent" />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="fixed top-0 z-30 w-full border-b border-border/70 bg-background/80 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/70 dark:border-white/15 dark:bg-background/35 dark:shadow-[0_8px_30px_rgba(0,0,0,0.18)] dark:supports-backdrop-filter:bg-background/25">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center">
              <Image
                src="/wellside-logo.png"
                alt="Wellside+"
                width={180}
                height={44}
                className="h-8 w-auto dark:hidden sm:h-9"
                priority
              />
              <Image
                src="/wellside-logo-white.png"
                alt="Wellside+"
                width={180}
                height={44}
                className="hidden h-8 w-auto dark:block sm:h-9"
                priority
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    href={userHomeHref}
                    aria-label="Go to home"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white/85 text-black transition-colors hover:border-black/25 hover:bg-white dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/85"
                  >
                    <House className="h-4 w-4" />
                  </Link>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-10 list-none items-center gap-1.5 rounded-full border border-black/15 bg-white/85 px-1.5 pr-2.5 text-black backdrop-blur-md backdrop-saturate-150 cursor-pointer select-none transition-colors hover:border-black/25 hover:bg-white dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/85"
                      >
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-xs font-semibold text-black dark:bg-white/15 dark:text-white">
                            {initials || "U"}
                          </span>
                        )}
                        <span className="max-w-28 truncate text-sm font-semibold text-black sm:max-w-36 dark:text-white">
                          {displayName}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-44 rounded-xl border border-border/70 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/20 dark:bg-background/90"
                    >
                      <Link
                        href={userHomeHref}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted cursor-pointer dark:hover:bg-white/10"
                      >
                        Go to home
                      </Link>
                      <form action={logout}>
                        <button
                          type="submit"
                          className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-muted hover:text-red-600 cursor-pointer dark:text-red-300 dark:hover:bg-white/10 dark:hover:text-red-200"
                        >
                          Logout
                        </button>
                      </form>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-border/60 bg-background/70 px-5 py-2 font-semibold text-foreground backdrop-blur-md backdrop-saturate-150 transition-colors hover:bg-muted dark:border-white/25 dark:bg-white/12 dark:hover:bg-white/24"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        <div aria-hidden className="h-20 sm:h-24" />

        {/* ── HERO content ────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-0 pt-10 sm:px-6 sm:pt-12 lg:pt-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 text-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-foreground/75 backdrop-blur-sm dark:border-white/20 dark:bg-black/30 dark:text-foreground/70">
              Fresh cuts, calm schedules
            </div>
            <h1 className="max-w-[20ch] font-(--font-display) text-4xl leading-[1.08] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
              Book a barber that fits your style and your time.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Wellside+ matches you with vetted barbers and real-time openings.
              Pick a flow, lock a slot, and walk out ready for the day.
            </p>
            {/* Quick-find bar */}
            <div className="mx-auto inline-flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-4 py-2.5 text-sm backdrop-blur-md sm:max-w-full sm:gap-3 sm:px-5 sm:py-3 dark:border-white/15 dark:bg-black/30">
              <MapPin
                className="h-4 w-4 shrink-0 text-foreground/55"
                aria-hidden="true"
              />
              <span className="max-w-[58vw] truncate font-semibold text-foreground sm:max-w-[70vw]">
                Wellside Barbershop, Taman Teratai, Skudai, Johor
              </span>
            </div>

            {/* Service pills */}
            {services.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 text-sm text-foreground/65">
                {services.map((service: Service) => (
                  <div
                    key={service.id}
                    className="rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 text-xs backdrop-blur-sm transition-colors hover:border-border hover:text-foreground/90 dark:border-white/10 dark:bg-black/30 dark:hover:border-white/20"
                  >
                    {service.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability card */}
          <div className="mx-auto mt-16 w-full max-w-6xl md:mt-20">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-6 backdrop-blur-xl md:p-8 dark:border-white/15 dark:bg-black/35">
              <HomeAvailability barbers={barbers} />
            </div>
          </div>
        </section>
      </div>

      {/* ── SERVICES ───────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-12 w-full max-w-6xl px-4 pb-0 pt-0 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
          <div className="grid gap-7 md:grid-cols-[0.95fr_1.05fr] md:items-stretch">
            {/* Left copy */}
            <div className="flex h-full flex-col gap-6">
              <div className="space-y-3">
                <h2 className="max-w-sm font-(--font-display) text-3xl leading-tight lg:text-[2.6rem]">
                  Build your perfect appointment.
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Our services.
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href="/login"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start booking
                </Link>
              </div>
            </div>

            {/* Right service list */}
            <div className="flex flex-col gap-2">
              {services.length ? (
                services.map((service: Service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/35 px-5 py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <div>
                      <p className="text-sm font-semibold">{service.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatServiceDuration(service.duration_minutes)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatServicePrice(service.base_price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No services available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-12 w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
          <div className="grid gap-7 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-3">
              <h2 className="max-w-[22ch] font-(--font-display) text-3xl leading-tight lg:text-[2.7rem]">
                Tap into Wellside+ and walk in with confidence.
              </h2>
            </div>
            <div className="flex flex-col gap-2.5 md:items-end">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-7 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:w-56"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-center text-xs text-muted-foreground sm:px-6">
        © {currentYear} Wellside+. All rights reserved.
      </footer>
    </div>
  );
}
