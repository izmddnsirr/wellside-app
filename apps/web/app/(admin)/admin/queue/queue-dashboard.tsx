"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Phone, Trash2, Tv, Undo2 } from "lucide-react";
import { formatMalaysiaPhone } from "@/utils/phone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueDashboardData, QueueListItem } from "@/utils/queue";
import type { QueueEntry } from "@/utils/queue-entries";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { toast } from "sonner";
import { serveBooking, completeBooking, cancelBooking, checkInBooking, undoCheckIn, undoServeBooking } from "./actions";
import { serveQueueEntry, completeQueueEntry, removeQueueEntry, undoServeQueueEntry } from "./queue-entry-actions";

type QueueDashboardProps = {
  data: QueueDashboardData;
  queueEntries: QueueEntry[];
};


function TypeBadge({ type }: { type: QueueListItem["type"] }) {
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500">
      {type}
    </span>
  );
}

function QueueCard({
  item,
  index,
  mode,
}: {
  item: QueueListItem;
  index: number;
  mode: "upcoming" | "waiting" | "serving";
}) {
  const [pending, startTransition] = useTransition();

  const statusLabel =
    mode === "serving" ? "In Service" : mode === "waiting" ? "Waiting" : "Not arrived";

  const displayNumber =
    mode === "upcoming"
      ? item.timeLabel
      : `B${String(item.queueNumber ?? index + 1).padStart(2, "0")}`;

  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3.5 space-y-2.5">
      {/* Top row: number + badge + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-mono font-bold text-foreground">{displayNumber}</span>
          <div className="w-px h-3.5 bg-border" />
          <TypeBadge type={item.type} />
          {mode !== "upcoming" && (
            <>
              <div className="w-px h-3.5 bg-border" />
              <span className="text-[11px] font-mono text-muted-foreground">{item.timeLabel}</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
      </div>

      {/* Customer info */}
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
        {item.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">{formatMalaysiaPhone(item.phone)}</span>
          </div>
        )}
        <p className="text-[12px] text-muted-foreground">{item.serviceLabel}</p>
        <p className="text-[12px] text-muted-foreground">Stylist: {item.barberLabel}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        {mode === "waiting" && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={pending}
            onClick={() => startTransition(() => undoCheckIn(item.id))}
          >
            <Undo2 className="size-3.5" />
          </Button>
        )}

        {mode === "serving" && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={pending}
            onClick={() => startTransition(() => undoServeBooking(item.id))}
          >
            <Undo2 className="size-3.5" />
          </Button>
        )}

        {item.phone && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            onClick={() => {
              if (!("speechSynthesis" in window)) return;
              window.speechSynthesis.cancel();
              const num = item.queueNumber ?? (index + 1);
              const label = String(num).padStart(2, "0");
              const getPreferredVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                return voices.find(v =>
                  v.lang.startsWith("en") && /samantha|karen|victoria|zira|female/i.test(v.name)
                ) ?? voices.find(v => v.lang.startsWith("en")) ?? null;
              };
              const speak = (text: string, rate: number, pitch: number) => {
                const u = new SpeechSynthesisUtterance(text);
                u.lang = "en-US"; u.rate = rate; u.pitch = pitch; u.volume = 1;
                const preferred = getPreferredVoice();
                if (preferred) u.voice = preferred;
                return u;
              };
              const ctx = new AudioContext();
              const chimeDuration = 1.2;
              const playBookingChime = () => {
                [[523, 0], [659, 0.2], [784, 0.4]].forEach(([freq, start]) => {
                  const osc = ctx.createOscillator();
                  const gainNode = ctx.createGain();
                  osc.connect(gainNode); gainNode.connect(ctx.destination);
                  osc.type = "sine"; osc.frequency.value = freq;
                  gainNode.gain.setValueAtTime(0.5, ctx.currentTime + start);
                  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.7);
                  osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + 0.7);
                });
              };
              ctx.resume().then(playBookingChime).catch(playBookingChime);
              toast.info(`Calling B${label} — ${item.name}`, { duration: 4000 });
              // Broadcast to TV display immediately
              const bc = new BroadcastChannel("tv_calling_booking");
              bc.postMessage({ type: "calling_booking_number", value: num });
              bc.close();

              setTimeout(() => {
                const digits = label.split("").map(d => d === "0" ? "zero" : d === "1" ? "one" : d === "2" ? "two" : d === "3" ? "three" : d === "4" ? "four" : d === "5" ? "five" : d === "6" ? "six" : d === "7" ? "seven" : d === "8" ? "eight" : "nine");
                const speakChain = (utterances: SpeechSynthesisUtterance[]) => {
                  for (let i = 0; i < utterances.length - 1; i++) {
                    const next = utterances[i + 1];
                    utterances[i].onend = () => window.speechSynthesis.speak(next);
                  }
                  window.speechSynthesis.speak(utterances[0]);
                };
                const u1 = speak(`Booking number,`, 0.7, 1.05);
                const bDigits1 = [speak(`B,`, 0.6, 1.0), ...digits.map(d => speak(d, 0.55, 1.0))];
                const bDigits2 = [speak(`B,`, 0.6, 1.0), ...digits.map(d => speak(d, 0.55, 1.0))];
                const uEnd = speak(`Please proceed to the counter.`, 0.72, 1.05);
                u1.onend = () => {
                  const last1 = bDigits1[bDigits1.length - 1];
                  last1.onend = () => setTimeout(() => speakChain([...bDigits2, uEnd]), 600);
                  speakChain(bDigits1);
                };
                window.speechSynthesis.speak(u1);
              }, chimeDuration * 1000);
            }}
          >
            Call
          </Button>
        )}

        {mode === "upcoming" && (
          <Button
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            disabled={pending}
            onClick={() => startTransition(() => checkInBooking(item.id))}
          >
            Check In
          </Button>
        )}

        {mode === "waiting" && (
          <Button
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            disabled={pending}
            onClick={() => startTransition(() => serveBooking(item.id))}
          >
            Serve
          </Button>
        )}

        {mode === "serving" && (
          <Button
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            disabled={pending}
            onClick={() => startTransition(() => completeBooking(item.id))}
          >
            Complete
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          disabled={pending}
          onClick={() => startTransition(() => cancelBooking(item.id))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function QueueEntryCard({
  entry,
}: {
  entry: QueueEntry;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-mono font-bold text-foreground">
            W{String(entry.queue_number).padStart(2, "0")}
          </span>
          <div className="w-px h-3.5 bg-border" />
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
            Walk-in
          </span>
          <div className="w-px h-3.5 bg-border" />
          <span className="text-[11px] font-mono text-muted-foreground">
            {new Intl.DateTimeFormat("en-MY", {
              timeZone: "Asia/Kuala_Lumpur",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(entry.created_at)).toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {entry.status === "serving" ? "In Service" : "Waiting"}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">{entry.name}</p>
        <div className="flex items-center gap-1.5">
          <Phone className="size-3 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">{formatMalaysiaPhone(entry.phone)}</span>
        </div>
        {entry.started_at && (
          <p className="text-[12px] text-muted-foreground">
            Started: {new Intl.DateTimeFormat("en-MY", {
              timeZone: "Asia/Kuala_Lumpur",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(entry.started_at)).toUpperCase()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        {entry.status === "serving" && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            disabled={pending}
            onClick={() => startTransition(() => undoServeQueueEntry(entry.id))}
          >
            <Undo2 className="size-3.5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-[12px]"
          onClick={() => {
            if (!("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel();

            const num = entry.queue_number;

            // Play chime then speak after it finishes
            const playChimeThenSpeak = () => {
              const ctx = new AudioContext();
              const chimeDuration = 1.2;
              const playWalkinChime = () => {
                [[523, 0], [659, 0.2], [784, 0.4]].forEach(([freq, start]) => {
                  const osc = ctx.createOscillator();
                  const gainNode = ctx.createGain();
                  osc.connect(gainNode);
                  gainNode.connect(ctx.destination);
                  osc.type = "sine";
                  osc.frequency.value = freq;
                  gainNode.gain.setValueAtTime(0.5, ctx.currentTime + start);
                  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.7);
                  osc.start(ctx.currentTime + start);
                  osc.stop(ctx.currentTime + start + 0.7);
                });
              };
              ctx.resume().then(playWalkinChime).catch(playWalkinChime);

              setTimeout(() => {
                const speak = (text: string, rate: number, pitch: number) => {
                  const u = new SpeechSynthesisUtterance(text);
                  u.lang = "en-US";
                  u.rate = rate;
                  u.pitch = pitch;
                  u.volume = 1;
                  const voices = window.speechSynthesis.getVoices();
                  const preferred = voices.find(v =>
                    v.lang.startsWith("en") && /samantha|karen|victoria|zira|female/i.test(v.name)
                  ) ?? voices.find(v => v.lang.startsWith("en")) ?? null;
                  if (preferred) u.voice = preferred;
                  return u;
                };

                const digits = String(num).padStart(2, "0").split("").map(d => d === "0" ? "zero" : d === "1" ? "one" : d === "2" ? "two" : d === "3" ? "three" : d === "4" ? "four" : d === "5" ? "five" : d === "6" ? "six" : d === "7" ? "seven" : d === "8" ? "eight" : "nine");
                const speakChain = (utterances: SpeechSynthesisUtterance[]) => {
                  for (let i = 0; i < utterances.length - 1; i++) {
                    const next = utterances[i + 1];
                    utterances[i].onend = () => window.speechSynthesis.speak(next);
                  }
                  window.speechSynthesis.speak(utterances[0]);
                };
                const u1 = speak(`Queue number,`, 0.7, 1.05);
                const wDigits1 = [speak(`W,`, 0.6, 1.0), ...digits.map(d => speak(d, 0.55, 1.0))];
                const wDigits2 = [speak(`W,`, 0.6, 1.0), ...digits.map(d => speak(d, 0.55, 1.0))];
                const uEnd = speak(`Please proceed to the counter.`, 0.72, 1.05);
                u1.onend = () => {
                  const last1 = wDigits1[wDigits1.length - 1];
                  last1.onend = () => setTimeout(() => speakChain([...wDigits2, uEnd]), 600);
                  speakChain(wDigits1);
                };
                window.speechSynthesis.speak(u1);
              }, chimeDuration * 1000);
            };

            toast.info(`Calling W${String(num).padStart(2, "0")}`, { duration: 4000 });
            // Broadcast to TV display
            const bc = new BroadcastChannel("tv_calling_walkin");
            bc.postMessage({ type: "calling_number", value: num });
            bc.close();

            playChimeThenSpeak();
          }}
        >
          Call
        </Button>

        {entry.status === "waiting" ? (
          <Button
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            disabled={pending}
            onClick={() => startTransition(() => serveQueueEntry(entry.id))}
          >
            Serve
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 rounded-lg text-[12px]"
            disabled={pending}
            onClick={() => startTransition(() => completeQueueEntry(entry.id))}
          >
            Complete
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          disabled={pending}
          onClick={() => startTransition(() => removeQueueEntry(entry.id))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function QueueDashboard({ data, queueEntries }: QueueDashboardProps) {
  const router = useRouter();
  const refreshRef = useRef<ReturnType<typeof setInterval>>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshRef.current = setInterval(() => router.refresh(), 5_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [router]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.pin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* TV Access Card */}
      <Card className="gap-0 rounded-2xl p-0">
        <CardHeader className="gap-0 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tv className="size-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-3">
                <p className="text-[12px] text-muted-foreground">PIN</p>
                <p className="text-[20px] font-mono font-semibold leading-none text-foreground">{data.pin}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-md"
                  onClick={handleCopy}
                  aria-label="Copy PIN"
                >
                  {copied ? <span className="text-[10px]">✓</span> : <Copy className="size-3" />}
                </Button>
                <code className="font-mono text-[12px] text-muted-foreground">{data.displayUrl}</code>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild className="h-8 rounded-lg px-3 text-[12px] font-medium">
                <Link href={data.displayUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open Display
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Queue columns */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Upcoming Bookings */}
        <Card className="gap-0 rounded-2xl p-0">
          <CardHeader className="gap-1 px-5 py-4 border-b">
            <CardTitle className="text-[18px] font-semibold text-foreground sm:text-[19px]">
              Upcoming Bookings
            </CardTitle>
            <CardDescription className="text-[12px] text-muted-foreground sm:text-[13px]">
              Scheduled appointments ({data.upcomingBookings.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5 space-y-3">
            {data.upcomingBookings.length === 0 ? (
              <Empty className="border-0 p-4">
                <EmptyHeader>
                  <EmptyTitle className="text-[13px] font-medium">No upcoming bookings</EmptyTitle>
                  <EmptyDescription className="text-[12px]">Scheduled appointments will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              data.upcomingBookings.slice(0, 10).map((item, i) => (
                <QueueCard key={item.id} item={item} index={i} mode="upcoming" />
              ))
            )}
          </CardContent>
        </Card>

        {/* Queue List */}
        {(() => {
          const waitingBookings = data.checkedInBookings.slice().sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0));
          const waitingEntries = queueEntries.filter((e) => e.status === "waiting").slice().sort((a, b) => a.queue_number - b.queue_number);
          const totalWaiting = waitingBookings.length + waitingEntries.length;

          return (
            <Card className="gap-0 rounded-2xl p-0">
              <CardHeader className="gap-1 px-5 py-4 border-b">
                <CardTitle className="text-[18px] font-semibold text-foreground sm:text-[19px]">
                  Queue List
                </CardTitle>
                <CardDescription className="text-[12px] text-muted-foreground sm:text-[13px]">
                  Waiting customers ({totalWaiting})
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 py-5 space-y-3">
                {totalWaiting === 0 ? (
                  <Empty className="border-0 p-4">
                    <EmptyHeader>
                      <EmptyTitle className="text-[13px] font-medium">No customers waiting</EmptyTitle>
                      <EmptyDescription className="text-[12px]">Walk-ins and checked-in bookings will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    {waitingBookings.map((item, i) => (
                      <QueueCard key={item.id} item={item} index={i} mode="waiting" />
                    ))}
                    {waitingEntries.map((entry) => (
                      <QueueEntryCard key={entry.id} entry={entry} />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Currently Serving */}
        <Card className="gap-0 rounded-2xl p-0">
          <CardHeader className="gap-1 px-5 py-4 border-b">
            <CardTitle className="text-[18px] font-semibold text-foreground sm:text-[19px]">
              Currently Serving
            </CardTitle>
            <CardDescription className="text-[12px] text-muted-foreground sm:text-[13px]">
              In service ({data.currentlyServing.length + queueEntries.filter(e => e.status === "serving").length})
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5 space-y-3">
            {(() => {
              type ServingItem =
                | { kind: "booking"; item: QueueListItem; sortKey: number }
                | { kind: "entry"; entry: QueueEntry; sortKey: number };

              const servingBookings: ServingItem[] = data.currentlyServing.map(item => ({
                kind: "booking",
                item,
                sortKey: item.startedAt ? new Date(item.startedAt).getTime() : Infinity,
              }));
              const servingEntries: ServingItem[] = queueEntries
                .filter(e => e.status === "serving")
                .map(entry => ({
                  kind: "entry",
                  entry,
                  sortKey: entry.started_at ? new Date(entry.started_at).getTime() : new Date(entry.created_at).getTime(),
                }));

              const all = [...servingBookings, ...servingEntries]
                .sort((a, b) => a.sortKey - b.sortKey)
                .slice(0, 10);

              if (all.length === 0) {
                return (
                  <Empty className="border-0 p-4">
                    <EmptyHeader>
                      <EmptyTitle className="text-[13px] font-medium">No one being served</EmptyTitle>
                      <EmptyDescription className="text-[12px]">Customers moved to service will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                );
              }

              return all.map((s, i) =>
                s.kind === "booking"
                  ? <QueueCard key={s.item.id} item={s.item} index={i} mode="serving" />
                  : <QueueEntryCard key={s.entry.id} entry={s.entry} />
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
