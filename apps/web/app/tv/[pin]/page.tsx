import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createDailyQueuePin, getQueueDashboardData } from "@/utils/queue";
import { getTodayQueueEntries } from "@/utils/queue-entries";
import { TvDisplay } from "./tv-display";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ pin: string }>;
};

export default async function TvPage({ params }: PageProps) {
  const { pin } = await params;
  const expectedPin = createDailyQueuePin();

  if (pin !== expectedPin) {
    redirect("/tv?error=invalid");
  }

  const [data, queueEntries] = await Promise.all([
    getQueueDashboardData(),
    getTodayQueueEntries(),
  ]);

  const queueUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/queue/join`
      : "/queue/join";

  const qrDataUrl = await QRCode.toDataURL(queueUrl, {
    width: 400,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const allBookings = [...data.checkedInBookings, ...data.upcomingBookings].sort(
    (a, b) => (a.queueNumber ?? Infinity) - (b.queueNumber ?? Infinity),
  );

  const servingEntries = queueEntries.filter(e => e.status === "serving");

  // FIFO: merge booking + walk-in serving slots, sorted by when service started
  type FifoSlot = { id: string; numberLabel: string; name: string; startedAt: string | null };

  const fifoServing: FifoSlot[] = [
    ...data.currentlyServing.map(b => ({
      id: b.id,
      numberLabel: b.queueNumber != null ? `B${String(b.queueNumber).padStart(2, "0")}` : "B--",
      name: b.name,
      startedAt: b.startedAt,
    })),
    ...servingEntries.map(e => ({
      id: e.id,
      numberLabel: `W${String(e.queue_number).padStart(2, "0")}`,
      name: e.name,
      startedAt: e.started_at ?? e.created_at,
    })),
  ].sort((a, b) => {
    if (!a.startedAt) return 1;
    if (!b.startedAt) return -1;
    return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
  });

  return (
    <TvDisplay
      checkedInBookings={allBookings}
      fifoServing={fifoServing}
      queueEntries={queueEntries}
      qrDataUrl={qrDataUrl}
      queueUrl={queueUrl}
    />
  );
}
