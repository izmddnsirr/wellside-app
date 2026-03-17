"use client";

import Link from "next/link";
import { type ComponentType, useState } from "react";
import {
  Clock3,
  Copy,
  ExternalLink,
  Tv,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueDashboardData, QueueListItem } from "@/utils/queue";

type QueueDashboardProps = {
  data: QueueDashboardData;
};

type QueueSectionCardProps = {
  title: string;
  subtitle: string;
  emptyLabel: string;
  icon: ComponentType<{ className?: string }>;
  items: QueueListItem[];
};

function QueueSectionCard({
  title,
  subtitle,
  emptyLabel,
  icon: Icon,
  items,
}: QueueSectionCardProps) {
  return (
    <Card className="gap-0 rounded-2xl py-0">
      <CardHeader className="gap-1 px-5 py-4">
        <CardTitle className="flex items-center gap-2.5 text-[18px] font-semibold text-foreground sm:text-[19px]">
          <Icon className="size-4.5 text-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-[12px] text-muted-foreground sm:text-[13px]">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-1">
        {items.length > 0 ? (
          <div className="space-y-2.5">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-muted/20 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {item.serviceLabel} · {item.barberLabel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-foreground">
                      {item.timeLabel}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {item.ref}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-8 items-end">
            <p className="text-[13px] text-muted-foreground">{emptyLabel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QueueDashboard({ data }: QueueDashboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const resolvedUrl = data.displayUrl.startsWith("/")
        ? `${window.location.origin}${data.displayUrl}`
        : data.displayUrl;

      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <Card className="gap-0 rounded-2xl py-0">
        <CardHeader className="gap-0 px-5 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2.5 text-[18px] font-semibold text-foreground sm:text-[19px]">
                  <Tv className="size-4.5 text-foreground" />
                  TV Display Access
                </CardTitle>
                <CardDescription className="max-w-2xl text-[12px] text-muted-foreground sm:text-[13px]">
                  Use this PIN to access the TV display. PIN refreshes daily.
                </CardDescription>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[12px] text-muted-foreground sm:text-[13px]">
                    6-Digit PIN
                  </p>
                  <p className="text-[28px] font-semibold leading-none tracking-[0.12em] text-foreground sm:text-[32px]">
                    {data.pin}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px]">
                  <span className="text-muted-foreground">TV Display URL:</span>
                  <code className="break-all font-mono text-[12px] text-foreground/80">
                    {data.displayUrl}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start xl:self-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-lg"
                onClick={handleCopy}
                aria-label="Copy TV display URL"
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                asChild
                className="h-9 rounded-lg px-3.5 text-[13px] font-medium"
              >
                <Link href={data.displayUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  {copied ? "Copied URL" : "Open Display"}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <QueueSectionCard
          title="Upcoming Bookings"
          subtitle={`Scheduled appointments (${data.upcomingBookings.length})`}
          emptyLabel="No upcoming bookings"
          icon={Clock3}
          items={data.upcomingBookings}
        />
        <QueueSectionCard
          title="Queue List"
          subtitle={`Waiting customers (${data.waitingCustomers.length})`}
          emptyLabel="No customers waiting"
          icon={Clock3}
          items={data.waitingCustomers}
        />
        <QueueSectionCard
          title="Currently Serving"
          subtitle={`In service (${data.currentlyServing.length})`}
          emptyLabel="No customers being served"
          icon={UserRound}
          items={data.currentlyServing}
        />
      </div>
    </div>
  );
}
