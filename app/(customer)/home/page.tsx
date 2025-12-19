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
      className={`${display.variable} ${body.variable} min-h-screen bg-[#f7f3ee] font-(--font-body) text-[#1b1a17]`}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#f0d6b9] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-[360px] w-[360px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#c7e2df] opacity-80 blur-3xl" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#1b1a17] text-white grid place-items-center text-lg font-semibold">
              W+
            </div>
            <div className="leading-tight">
              <p className="text-xl font-semibold">Wellside+</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#5a564d]">
                Barber booking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-[#d8cfc2] bg-white/60 px-4 py-2">
              Skudai, Johor
            </span>
            <Link
              href="/login"
              className="rounded-full bg-[#1b1a17] px-4 py-2 text-white"
            >
              My bookings
            </Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#5a564d]">
              Fresh cuts, calm schedules
            </div>
            <h1 className="font-(--font-display) text-4xl leading-tight sm:text-5xl">
              Book a barber that fits your style, your time, and your city.
            </h1>
            <p className="max-w-xl text-base text-[#4a463f] sm:text-lg">
              Wellside+ matches you with vetted barbers and real-time openings.
              Pick a vibe, lock a slot, and walk out ready for the day.
            </p>
            <div className="grid gap-3 rounded-3xl border border-[#e0d6c7] bg-white/80 p-4 shadow-[0_20px_40px_rgba(27,26,23,0.08)] sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[#ebe1d3] bg-white px-4 py-3 text-sm">
                  <span className="text-[#8a8276]">Location</span>
                  <span className="font-medium">Bukit Bintang</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#ebe1d3] bg-white px-4 py-3 text-sm">
                  <span className="text-[#8a8276]">Service</span>
                  <span className="font-medium">Haircut + Beard</span>
                </div>
              </div>
              <button className="rounded-2xl bg-[#1b1a17] px-6 py-4 text-sm font-semibold text-white">
                Find a slot
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#5a564d]">
              <div className="rounded-full border border-[#dfd4c6] bg-white/70 px-4 py-2">
                120+ vetted barbers
              </div>
              <div className="rounded-full border border-[#dfd4c6] bg-white/70 px-4 py-2">
                Live availability
              </div>
              <div className="rounded-full border border-[#dfd4c6] bg-white/70 px-4 py-2">
                Cashless checkout
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -rotate-2 rounded-[32px] bg-[#1b1a17] opacity-90" />
            <div className="relative grid gap-6 rounded-[32px] bg-[#26231f] p-6 text-white shadow-[0_30px_60px_rgba(27,26,23,0.2)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c8c1b7]">
                  Today
                </p>
                <span className="rounded-full border border-[#4a453e] px-3 py-1 text-xs">
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
                      className="flex items-center justify-between rounded-2xl border border-[#3f3a33] bg-[#2f2b27] px-4 py-3 text-sm"
                    >
                      <span>{time}</span>
                      <span className="text-[#c8c1b7]">Book now</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-[#f0d6b9] px-4 py-4 text-[#1b1a17]">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6b5c49]">
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
            <p className="text-xs uppercase tracking-[0.2em] text-[#6c665e]">
              Popular near you
            </p>
            <h2 className="text-3xl font-semibold">Barbers trending today</h2>
          </div>
          <Link href="/barber" className="text-sm font-semibold text-[#1b1a17]">
            View all barbers
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featuredBarbers.map((barber) => (
            <div
              key={barber.name}
              className="flex h-full flex-col gap-4 rounded-3xl border border-[#e4d9ca] bg-white p-5 shadow-[0_20px_40px_rgba(27,26,23,0.05)]"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-[#f1ebe2] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6a6156]">
                  {barber.tag}
                </div>
                <span className="text-sm font-medium">
                  {barber.rating} rating
                </span>
              </div>
              <div>
                <h3 className=" text-xl font-semibold">{barber.name}</h3>
                <p className="text-sm text-[#6a635a]">
                  {barber.distance} away · {barber.price}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between text-sm">
                <span className="text-[#8b8378]">Next slot 2:30 PM</span>
                <button className="rounded-full border border-[#1b1a17] px-3 py-1 text-xs font-semibold">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="grid gap-6 rounded-[36px] border border-[#e4d9ca] bg-white p-6 md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6c665e]">
                Services
              </p>
              <h2 className=" text-3xl font-semibold">
                Build your perfect appointment.
              </h2>
              <p className="mt-3 text-sm text-[#6a635a]">
                Customize your cut with premium add-ons and curated routines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full bg-[#1b1a17] px-4 py-2 text-sm font-semibold text-white">
                Start booking
              </button>
              <button className="rounded-full border border-[#1b1a17] px-4 py-2 text-sm font-semibold">
                Save for later
              </button>
            </div>
          </div>
          <div className="grid gap-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-2xl border border-[#efe5d7] bg-[#faf6f0] px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className="text-xs text-[#7a7266]">{service.time}</p>
                </div>
                <span className="text-sm font-semibold text-[#1b1a17]">
                  {service.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-[#e4d9ca] bg-[#1b1a17] p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8c1b7]">
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
                  className="rounded-2xl border border-[#3f3a33] bg-[#26231f] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#c8c1b7]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[32px] border border-[#e4d9ca] bg-white p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6c665e]">
              Customer mood
            </p>
            <h2 className=" text-3xl font-semibold">
              "Best cut I have had this year."
            </h2>
            <p className="text-sm text-[#6a635a]">
              From instant confirmations to the vibe check on arrival, Wellside+
              keeps grooming stress-free.
            </p>
            <div className="mt-auto flex items-center justify-between rounded-2xl bg-[#f1ebe2] px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">Saif B.</p>
                <p className="text-xs text-[#7a7266]">
                  Weekly client · 18 visits
                </p>
              </div>
              <div className="text-sm font-semibold">4.9 / 5</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-6 rounded-[36px] border border-[#e4d9ca] bg-[#f0d6b9] p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b5c49]">
              Ready to book?
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Tap into Wellside+ and walk in with confidence.
            </h2>
            <p className="mt-2 text-sm text-[#5b4c3a]">
              Save favorites, track appointments, and unlock member perks.
            </p>
          </div>
          <div className="flex flex-col items-start justify-center gap-3">
            <button className="w-full rounded-full bg-[#1b1a17] px-5 py-3 text-sm font-semibold text-white">
              Create account
            </button>
            <button className="w-full rounded-full border border-[#1b1a17] px-5 py-3 text-sm font-semibold">
              See today&apos;s availability
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
