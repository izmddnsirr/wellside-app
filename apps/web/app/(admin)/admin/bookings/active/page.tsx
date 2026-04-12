import { Suspense } from "react";
import { AdminShell } from "../../components/admin-shell";
import { BookingsClient } from "../bookings-client";
import { getBookings } from "../bookings-data";
import {
  cancelBooking,
  deleteBooking,
  updateBookingStatus,
} from "../actions";
import { allowedStatuses } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function BookingsContent() {
  const { bookings, errorMessage } = await getBookings();
  return (
    <BookingsClient
      bookings={bookings}
      errorMessage={errorMessage}
      allowedStatuses={[...allowedStatuses]}
      updateBookingStatus={updateBookingStatus}
      cancelBooking={cancelBooking}
      deleteBooking={deleteBooking}
      view="active"
    />
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Active bookings">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Suspense fallback={<BookingsSkeleton />}>
          <BookingsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
