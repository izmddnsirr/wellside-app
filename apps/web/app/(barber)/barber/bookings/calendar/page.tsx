import { Suspense } from "react";
import { BarberShell } from "../../components/barber-shell";
import { BookingsClient } from "../../../../(admin)/admin/bookings/bookings-client";
import { getBarberBookings } from "../bookings-data";
import { allowedStatuses, updateBookingStatus } from "../actions";
import { createBarberClient } from "@/utils/supabase/server";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { loadShopOperatingRules } from "@/utils/shop-operations";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function CalendarContent() {
  const supabase = await createBarberClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ bookings, errorMessage }, operatingRules] = await Promise.all([
    getBarberBookings(),
    loadShopOperatingRules(createAdminAuthClient()),
  ]);

  const barberOptions = user
    ? [
        {
          id: user.id,
          name: "Me",
        },
      ]
    : [];

  return (
    <BookingsClient
      bookings={bookings}
      errorMessage={errorMessage}
      allowedStatuses={[...allowedStatuses]}
      updateBookingStatus={updateBookingStatus}
      allowCancel={false}
      allowDelete={false}
      showActions={false}
      barberOptions={barberOptions}
      shopWeeklySchedule={operatingRules.weeklySchedule}
      shopTemporaryClosures={operatingRules.temporaryClosures}
      shopRestWindows={operatingRules.restWindows}
      view="calendar"
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-37.5" />
          <Skeleton className="h-9 w-37.5" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-center h-11 bg-muted/20 border-b border-border/60">
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-120 w-full rounded-none" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <BarberShell title="Calendar">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarContent />
        </Suspense>
      </div>
    </BarberShell>
  );
}
