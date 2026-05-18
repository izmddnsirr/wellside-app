import { Suspense } from "react";
import { AdminShell } from "../../components/admin-shell";
import { BookingsClient } from "../bookings-client";
import { getBookingFormOptions, getBookings } from "../bookings-data";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { loadShopOperatingRules } from "@/utils/shop-operations";
import {
  cancelBooking,
  createBarberUnavailability,
  createBooking,
  deleteBarberUnavailability,
  deleteBooking,
  updateBookingStatus,
} from "../actions";
import { allowedStatuses } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function CalendarContent() {
  const [
    { bookings, unavailabilityEntries, errorMessage },
    { customerOptions, barberOptions, serviceOptions },
    operatingRules,
  ] = await Promise.all([
    getBookings(),
    getBookingFormOptions(),
    loadShopOperatingRules(createAdminAuthClient()),
  ]);

  return (
    <BookingsClient
      bookings={bookings}
      unavailabilityEntries={unavailabilityEntries}
      errorMessage={errorMessage}
      allowedStatuses={[...allowedStatuses]}
      updateBookingStatus={updateBookingStatus}
      cancelBooking={cancelBooking}
      deleteBooking={deleteBooking}
      createBooking={createBooking}
      createBarberUnavailability={createBarberUnavailability}
      deleteBarberUnavailability={deleteBarberUnavailability}
      customerOptions={customerOptions}
      barberOptions={barberOptions}
      serviceOptions={serviceOptions}
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
      {/* Filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-37.5" />
          <Skeleton className="h-9 w-37.5" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      {/* Calendar container */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Week label row */}
        <div className="flex items-center justify-center h-11 bg-muted/20 border-b border-border/60">
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Barber header row */}
        <div className="flex border-b border-border/60 bg-muted/40">
          <div className="w-16 shrink-0 border-r border-border/60" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-1 items-center justify-center gap-2 border-r border-border/60 px-3 py-3 last:border-r-0 h-18">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        {/* Time slots */}
        <Skeleton className="h-120 w-full rounded-none" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Calendar">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
