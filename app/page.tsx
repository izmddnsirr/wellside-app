import Link from "next/link";
import { Instrument_Sans, Space_Grotesk } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const featuredBarbers = [
  {
    name: "Rafiq Studio",
    rating: "4.9",
    distance: "0.6 km",
    price: "From RM35",
    tag: "Fade specialist",
  },
  {
    name: "Clip Corner",
    rating: "4.8",
    distance: "1.1 km",
    price: "From RM28",
    tag: "Walk-ins welcome",
  },
  {
    name: "Waves & Co.",
    rating: "4.7",
    distance: "2.4 km",
    price: "From RM40",
    tag: "Texture expert",
  },
];

const services = [
  { name: "Classic Cut", time: "45 min", price: "RM35" },
  { name: "Skin Fade", time: "60 min", price: "RM50" },
  { name: "Beard Trim", time: "30 min", price: "RM25" },
  { name: "Hair + Beard", time: "75 min", price: "RM70" },
];

const openings = ["11:15 AM", "12:00 PM", "2:30 PM", "4:00 PM", "6:15 PM"];

export default function CustomerHome() {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-background font-(--font-body) text-foreground`}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/20 opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-[360px] w-[360px] translate-x-1/3 -translate-y-1/4 rounded-full bg-secondary/30 opacity-80 blur-3xl" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
              W+
            </div>
            <div className="leading-tight">
              <p className="text-xl font-semibold">Wellside+</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Barber booking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-border/60 bg-background/60 px-4 py-2">
              Skudai, Johor
            </span>
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-2 text-primary-foreground"
            >
              My bookings
            </Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Fresh cuts, calm schedules
            </div>
            <h1 className="font-(--font-display) text-4xl leading-tight sm:text-5xl">
              Book a barber that fits your style, your time, and your city.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Wellside+ matches you with vetted barbers and real-time openings.
              Pick a vibe, lock a slot, and walk out ready for the day.
            </p>
            <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-lg sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">Bukit Bintang</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">Haircut + Beard</span>
                </div>
              </div>
              <button className="rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground">
                Find a slot
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2">
                120+ vetted barbers
              </div>
              <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2">
                Live availability
              </div>
              <div className="rounded-full border border-border/60 bg-background/70 px-4 py-2">
                Cashless checkout
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -rotate-2 rounded-[32px] bg-muted opacity-90" />
            <div className="relative grid gap-6 rounded-[32px] bg-card p-6 text-foreground shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Today
                </p>
                <span className="rounded-full border border-border px-3 py-1 text-xs">
                  5 slots left
                </span>
              </div>
              <div className="space-y-4">
                <h2 className="font-(--font-display) text-2xl">
                  Openings near you
                </h2>
                <div className="grid gap-3">
                  {openings.map((time) => (
                    <button
                      key={time}
                      className="flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm"
                    >
                      <span>{time}</span>
                      <span className="text-muted-foreground">Book now</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-4 text-secondary-foreground">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Member perk
                </p>
                <p className="mt-2 text-sm font-medium">
                  Save 15% on your first appointment this week.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Popular near you
            </p>
            <h2 className="text-3xl font-semibold">Barbers trending today</h2>
          </div>
          <Link href="/barber" className="text-sm font-semibold text-foreground">
            View all barbers
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featuredBarbers.map((barber) => (
            <div
              key={barber.name}
              className="flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {barber.tag}
                </div>
                <span className="text-sm font-medium">
                  {barber.rating} rating
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{barber.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {barber.distance} away · {barber.price}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next slot 2:30 PM</span>
                <button className="rounded-full border border-border px-3 py-1 text-xs font-semibold">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="grid gap-6 rounded-[36px] border border-border/60 bg-card p-6 md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Services
              </p>
              <h2 className=" text-3xl font-semibold">
                Build your perfect appointment.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Customize your cut with premium add-ons and curated routines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Start booking
              </button>
              <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold">
                Save for later
              </button>
            </div>
          </div>
          <div className="grid gap-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.time}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {service.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-border/60 bg-card p-6 text-foreground">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3  text-3xl font-semibold">
              A calm booking flow, from browse to chair.
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                "Pick a barber and vibe",
                "Lock a time that works",
                "Pay once, relax later",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border bg-muted/60 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[32px] border border-border/60 bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Customer mood
            </p>
            <h2 className=" text-3xl font-semibold">
              "Best cut I have had this year."
            </h2>
            <p className="text-sm text-muted-foreground">
              From instant confirmations to the vibe check on arrival, Wellside+
              keeps grooming stress-free.
            </p>
            <div className="mt-auto flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">Saif B.</p>
                <p className="text-xs text-muted-foreground">
                  Weekly client · 18 visits
                </p>
              </div>
              <div className="text-sm font-semibold">4.9 / 5</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-6 rounded-[36px] border border-border/60 bg-secondary p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Ready to book?
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Tap into Wellside+ and walk in with confidence.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save favorites, track appointments, and unlock member perks.
            </p>
          </div>
          <div className="flex flex-col items-start justify-center gap-3">
            <button className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
              Create account
            </button>
            <button className="w-full rounded-full border border-border px-5 py-3 text-sm font-semibold">
              See today&apos;s availability
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
