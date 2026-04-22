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
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-130 w-full" />
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
