import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
  MapPin,
  MessageCircle,
  Music2,
} from "lucide-react";
import DeferredColorBends from "@/components/deferred-color-bends";
import { HomeAvailabilitySection } from "@/components/customer/home-availability-section";
import { HomeHeaderActions } from "@/components/customer/home-header-actions";
import { TotalBookingsCounter } from "@/components/customer/total-bookings-counter";
import {
  getCachedActiveServices,
  getCachedTotalBookingsCount,
  type Service,
} from "@/utils/home-data";

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

export default async function CustomerHome() {
  const currentYear = new Date().getFullYear();
  const [services, totalBookings] = await Promise.all([
    getCachedActiveServices(),
    getCachedTotalBookingsCount(),
  ]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ── HERO + NAV (shared ColorBends background) ──────────────────────── */}
      <div className="relative">
        {/* Defer heavy background animation and keep a static gradient fallback */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(90%_65%_at_50%_10%,rgba(255,92,122,0.16),transparent),radial-gradient(60%_50%_at_30%_30%,rgba(0,255,209,0.14),transparent),radial-gradient(75%_70%_at_80%_20%,rgba(138,92,255,0.14),transparent)]">
          <DeferredColorBends />
        </div>

        {/* Bottom fade into background */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48 bg-linear-to-t from-background to-transparent" />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="fixed top-0 z-30 w-full border-b border-border/70 bg-background/80 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/70 dark:border-white/10 dark:bg-background/75 dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)] dark:supports-backdrop-filter:bg-background/65">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center">
              <Image
                src="/wellside-logo.png"
                alt="Wellside+"
                width={180}
                height={44}
                className="h-8 w-auto theme-invert sm:h-9"
                priority
                sizes="180px"
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <HomeHeaderActions />
            </div>
          </div>
        </header>
        <div aria-hidden className="h-20 sm:h-24" />

        {/* ── HERO content ────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-0 pt-10 sm:px-6 sm:pt-12 lg:pt-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 text-center">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2.5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Booking Now
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <h1 className="max-w-[20ch] text-4xl leading-[1.08] tracking-tight font-black text-foreground text-balance sm:text-5xl lg:text-6xl">
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
            <p className="pt-2 text-base text-foreground/85 sm:text-xl">
              <TotalBookingsCounter value={totalBookings} /> appointments have
              been booked with us. Secure yours today.
            </p>
          </div>

          {/* Availability card */}
          <div className="mx-auto mt-16 w-full max-w-6xl md:mt-20">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-6 backdrop-blur-xl md:p-8 dark:border-white/15 dark:bg-black/35">
              <HomeAvailabilitySection />
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
                <h2 className="max-w-sm text-3xl leading-tight lg:text-[2.6rem]">
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
              <h2 className="max-w-[22ch] text-3xl leading-tight lg:text-[2.7rem]">
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

      <footer className="mt-8 w-full border-t border-border/60 bg-card/80">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 text-sm md:grid-cols-3 md:items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-foreground/70">
                Operation Hours
              </p>
              <ul className="space-y-1.5 text-foreground">
                <li className="space-y-0.5">
                  <span className="font-medium">Mon - Wed</span>
                  <p className="text-muted-foreground">12:00 PM - 10:00 PM</p>
                </li>
                <li className="space-y-0.5">
                  <span className="font-medium">Thursday</span>
                  <p className="text-muted-foreground">Closed</p>
                </li>
                <li className="space-y-0.5">
                  <span className="font-medium">Friday</span>
                  <p className="text-muted-foreground">3:00 PM - 10:00 PM</p>
                </li>
                <li className="space-y-0.5">
                  <span className="font-medium">Sat - Sun</span>
                  <p className="text-muted-foreground">12:00 PM - 10:00 PM</p>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-foreground/70">
                Social Media
              </p>
              <div className="flex flex-col gap-1.5">
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-foreground/70"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                  Instagram
                </Link>
                <Link
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-foreground/70"
                >
                  <Music2 className="h-4 w-4" aria-hidden="true" />
                  TikTok
                </Link>
                <Link
                  href="https://wa.me/601112564440"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-foreground/70"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-foreground/70">
                Address
              </p>
              <ul className="space-y-0.5 leading-7">
                <li className="font-medium text-foreground">
                  Wellside Barbershop
                </li>
                <li className="text-muted-foreground">24, Jalan Palas 5,</li>
                <li className="text-muted-foreground">Taman Teratai,</li>
                <li className="text-muted-foreground">81300 Kulai,</li>
                <li className="text-muted-foreground">
                  Johor Darul Ta&apos;zim, Malaysia
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4 text-center text-xs text-muted-foreground">
            © {currentYear} Wellside+. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
