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

  return (
    <TvDisplay
      checkedInBookings={allBookings}
      currentlyServing={data.currentlyServing}
      servingEntries={servingEntries}
      queueEntries={queueEntries}
      qrDataUrl={qrDataUrl}
      queueUrl={queueUrl}
    />
  );
}
