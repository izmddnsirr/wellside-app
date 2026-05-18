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

export const revalidate = 60;

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
      view="past"
    />
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-37.5" />
          <Skeleton className="h-9 w-37.5" />
          <Skeleton className="h-9 w-37.5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-45" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 bg-muted/40 border-b border-border/60 px-4 py-3">
          <Skeleton className="h-3 w-[12%]" />
          <Skeleton className="h-3 w-[14%]" />
          <Skeleton className="h-3 w-[22%]" />
          <Skeleton className="h-3 w-[18%]" />
          <Skeleton className="h-3 w-[14%]" />
          <Skeleton className="h-3 w-[10%]" />
          <Skeleton className="ml-auto h-3 w-[10%]" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 bg-background px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-[12%]" />
            <Skeleton className="h-4 w-[14%]" />
            <Skeleton className="h-4 w-[22%]" />
            <Skeleton className="h-4 w-[18%]" />
            <Skeleton className="h-4 w-[14%]" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Past bookings">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Suspense fallback={<BookingsSkeleton />}>
          <BookingsContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
