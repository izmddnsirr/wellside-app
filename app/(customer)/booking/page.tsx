import { Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BookingPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
            Booking
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">
            Choose your chair now
          </p>
        </div>
      </header>
      <section className="space-y-4" style={{ animationDelay: "80ms" }}>
        <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
          Upcoming
        </p>
        <div className="rounded-3xl border-slate-200 border bg-white/85">
          <div className="p-4">
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500">
                No upcoming bookings yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" style={{ animationDelay: "160ms" }}>
        <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">
          Quick Pick
        </p>
        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-full bg-slate-900 text-base font-semibold text-white hover:bg-slate-900/90"
        >
          <Link href="/booking/services">Book appointment</Link>
        </Button>
      </section>
    </div>
  );
}
