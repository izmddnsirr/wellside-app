import { BarberShell } from "../../components/barber-shell";
import { BookingsClient } from "../../../../(admin)/admin/bookings/bookings-client";
import { getBarberBookings } from "../bookings-data";
import { allowedStatuses, updateBookingStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { bookings, errorMessage } = await getBarberBookings();

  return (
    <BarberShell
      title="Past bookings"
      description="Completed and cancelled bookings."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <BookingsClient
          bookings={bookings}
          errorMessage={errorMessage}
          allowedStatuses={[...allowedStatuses]}
          updateBookingStatus={updateBookingStatus}
          allowCancel={false}
          allowDelete={false}
          showActions={false}
          view="past"
        />
      </div>
    </BarberShell>
  );
}
