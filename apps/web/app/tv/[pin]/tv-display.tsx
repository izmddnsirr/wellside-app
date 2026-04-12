"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { QueueListItem } from "@/utils/queue";
import type { QueueEntry } from "@/utils/queue-entries";

type FifoSlot = {
  id: string;
  numberLabel: string;
  name: string;
  startedAt: string | null;
};

type TvDisplayProps = {
  checkedInBookings: QueueListItem[];
  fifoServing: FifoSlot[];
  queueEntries: QueueEntry[];
  qrDataUrl: string;
  queueUrl: string;
};

const timeFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function LiveTime({ now }: { now: Date | null }) {
  if (!now) {
    return (
      <div className="flex items-baseline justify-center gap-2 leading-none">
        <span className="text-3xl font-mono font-bold text-white">--:--:--</span>
        <span className="text-3xl font-mono font-bold text-white">--</span>
      </div>
    );
  }

  const parts = timeFormatter.formatToParts(now);
  const time = parts
    .filter((p) => p.type !== "dayPeriod")
    .map((p) => p.value)
    .join("")
    .trim();
  const period = (parts.find((p) => p.type === "dayPeriod")?.value ?? "").toUpperCase();

  return (
    <div className="flex items-baseline justify-center gap-2 leading-none">
      <span className="text-3xl font-mono font-bold text-white">{time}</span>
      <span className="text-3xl font-mono font-bold text-white">{period}</span>
    </div>
  );
}

function LiveDate({ now }: { now: Date | null }) {
  if (!now) return null;
  return (
    <p className="text-lg tracking-wide font-medium text-white text-right">{dateFormatter.format(now)}</p>
  );
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function BookingPanel({ items }: { items: QueueListItem[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-xl font-bold tracking-[0.18em] text-purple-400 uppercase mb-4 text-center">
        Booking
      </div>
      <table className="w-full border-collapse align-top">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Number</th>
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Slot</th>
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Barber</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-xl text-white/40 py-10">No bookings today</td>
            </tr>
          ) : (
            items.slice(0, 8).map((item) => (
              <tr key={item.id} className="border-b border-white/10">
                <td className="text-center py-4 text-2xl font-mono font-bold text-purple-400">
                  {item.queueNumber != null ? `B${String(item.queueNumber).padStart(2, "0")}` : "—"}
                </td>
                <td className="text-center py-4 text-xl font-mono text-white/80 uppercase">{item.timeLabel}</td>
                <td className="text-center py-4 text-xl text-white/80">{item.barberLabel.split(" ")[0]}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function QueuePanel({ items }: { items: QueueEntry[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-xl font-bold tracking-[0.18em] text-amber-400 uppercase mb-4 text-center">
        Queue
      </div>
      <table className="w-full border-collapse align-top">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Number</th>
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Type</th>
            <th className="text-sm font-semibold tracking-[0.14em] uppercase text-white/50 py-2 text-center w-1/3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-xl text-white/40 py-10">No customers in queue</td>
            </tr>
          ) : (
            items.slice(0, 8).map((entry) => (
              <tr key={entry.id} className="border-b border-white/10">
                <td className="text-center py-4 text-2xl font-mono font-bold text-amber-400">W{String(entry.queue_number).padStart(2, "0")}</td>
                <td className="text-center py-4 text-xl text-white/80">Walk-In</td>
                <td className="text-center py-4 text-xl font-mono text-white/80 uppercase">
                  {timeFormatter.format(new Date(entry.created_at))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const SERVING_DURATION_MS = 45 * 60 * 1000;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ServingPanel({ slots }: { slots: FifoSlot[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeSlots = slots.filter((slot) => {
    if (!slot.startedAt) return true;
    return now - new Date(slot.startedAt).getTime() < SERVING_DURATION_MS;
  });

  const displayed = Array.from({ length: 3 }, (_, i) => activeSlots[i] ?? null);

  return (
    <div className="flex flex-col h-full">
      <div className="text-xl font-bold tracking-[0.18em] text-emerald-400 uppercase mb-4 text-center">
        Serving
      </div>
      <div className="grid grid-cols-3 gap-3">
        {displayed.map((slot, i) => {
          const remaining =
            slot?.startedAt != null
              ? Math.max(0, SERVING_DURATION_MS - (now - new Date(slot.startedAt).getTime()))
              : null;
          const isUrgent = remaining !== null && remaining < 5 * 60 * 1000;

          return (
            <div
              key={slot?.id ?? i}
              className={`rounded-xl flex flex-col items-center justify-center p-4 h-28 border ${
                slot
                  ? isUrgent
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {slot ? (
                <>
                  <span
                    className={`text-4xl font-mono font-bold leading-none ${
                      isUrgent ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {slot.numberLabel}
                  </span>
                  {remaining !== null && (
                    <span
                      className={`text-base font-mono mt-2 tabular-nums ${
                        isUrgent ? "text-red-400" : "text-emerald-300/70"
                      }`}
                    >
                      {formatCountdown(remaining)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-3xl font-bold text-white/20">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className="fixed bottom-4 left-4 z-50 flex items-center justify-center size-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/50 hover:text-white"
    >
      {isFullscreen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        </svg>
      )}
    </button>
  );
}

export function TvDisplay({
  checkedInBookings,
  fifoServing,
  queueEntries,
  qrDataUrl,
  queueUrl,
}: TvDisplayProps) {
  const router = useRouter();
  const now = useClock();
  const refreshRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    refreshRef.current = setInterval(() => {
      router.refresh();
    }, 5_000);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col text-white select-none overflow-hidden">
      {/* Header */}
      <header className="grid grid-cols-3 items-center px-8 py-3 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wellside-logo-white.png" alt="Wellside+" className="h-7 w-auto" />

        <LiveTime now={now} />

        <LiveDate now={now} />
      </header>

      {/* Main columns */}
      <main className="grid grid-cols-3 flex-1 divide-x divide-white/10 overflow-hidden">
        {/* Booking */}
        <section className="px-8 py-6">
          <BookingPanel items={checkedInBookings} />
        </section>

        {/* Queue */}
        <section className="px-8 py-6">
          <QueuePanel items={queueEntries.filter(e => e.status === "waiting")} />
        </section>

        {/* Serving + QR */}
        <section className="flex flex-col divide-y divide-white/10">
          <div className="px-8 py-6">
            <ServingPanel slots={fifoServing} />
          </div>

          {/* QR Code */}
          <div className="flex-1 flex items-center justify-center px-8 py-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg font-bold tracking-[0.22em] uppercase text-white">
                Scan to Queue
              </p>
              <div className="bg-white p-3 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${queueUrl}`}
                  className="size-48 block"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <FullscreenButton />
    </div>
  );
}
