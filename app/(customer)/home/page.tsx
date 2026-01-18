import { Calendar, CalendarCheck, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl text-slate-900 lg:text-4xl">
            Hi, Izamuddin
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">
            Clean lines. Calm day.
          </p>
        </div>
      </header>

      <div className="grid gap-8">
        <div className="flex flex-col gap-6">
          <div
            className=" flex flex-col border  gap-0 overflow-hidden rounded-3xl border-slate-200/70 bg-white py-0 "
            style={{ animationDelay: "80ms" }}
          >
            <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 gap-3 bg-slate-900 py-6 text-white">
              <p className="text-[11px] uppercase tracking-[0.4em] text-slate-300">
                Upcoming
              </p>
              <div className="space-y-1">
                <div className="leading-none font-semibold text-2xl">
                  No upcoming booking
                </div>
                <div className=" text-sm text-slate-300">
                  Book a slot to see it here.
                </div>
              </div>
            </div>
            <div className="px-6 bg-white py-5">
              <Button
                size="lg"
                className="w-full rounded-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-900/90"
              >
                <CalendarCheck className="h-4 w-4" />
                Start booking
              </Button>
            </div>
          </div>

          <section
            className="grid grid-cols-3 gap-3"
            style={{ animationDelay: "160ms" }}
          >
            <div className=" text-card-foreground flex flex-col  border gap-3 rounded-3xl border-slate-200/70 bg-white px-4 py-4 ">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Next
              </div>
              <div className="leading-none font-semibold mt-3 text-base text-slate-900">
                None
              </div>
              <div className="text-sm text-slate-400">
                Book now
              </div>
            </div>
            <div className=" flex flex-col  border gap-3 rounded-3xl border-slate-200/70 bg-white px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Total
              </div>
              <div className="leading-none font-semibold mt-3 text-base text-slate-900">
                0
              </div>
              <div className=" text-sm text-slate-400">
                Bookings
              </div>
            </div>
            <div className="  flex flex-col  border gap-3 rounded-3xl border-transparent bg-slate-900 px-4 py-4 text-white ">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Try AI
              </div>
              <div className="leading-none font-semibold mt-3 text-base text-white">
                Suggest
              </div>
              <div className=" text-sm  text-slate-300">
                New look
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
