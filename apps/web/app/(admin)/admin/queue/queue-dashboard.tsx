"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Phone, Trash2, Tv, Undo2 } from "lucide-react";
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
        </div>
        <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
      </div>

      {/* Customer info */}
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
        {item.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">{item.phone}</span>
          </div>
        )}
        <p className="text-[12px] text-muted-foreground">{item.serviceLabel}</p>
        <p className="text-[12px] text-muted-foreground">Stylist: {item.barberLabel}</p>
        <p className="text-[12px] text-muted-foreground">
          {mode === "serving" ? `Started: ${item.timeLabel}` : item.timeLabel}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        {item.phone && (
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[12px]">
            <a href={`tel:${item.phone}`}>Call</a>
          </Button>
        )}

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
        </div>
        <span className="text-[11px] text-muted-foreground">
          {entry.status === "serving" ? "In Service" : "Waiting"}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">{entry.name}</p>
        <div className="flex items-center gap-1.5">
          <Phone className="size-3 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">{entry.phone}</span>
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
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-[12px]"
        >
          <a href={`tel:${entry.phone}`}>Call</a>
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
  const [copied, setCopied] = useState(false);

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
