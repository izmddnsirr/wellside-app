import { AdminShell } from "../../components/admin-shell";
import { BookingsClient } from "../bookings-client";
import { getBookings } from "../bookings-data";
import {
  cancelBooking,
  deleteBooking,
  updateBookingStatus,
} from "../actions";
import { allowedStatuses } from "../constants";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { bookings, errorMessage } = await getBookings();

  return (
    <AdminShell
      title="Active bookings"
      description="Upcoming and in-progress appointments."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <BookingsClient
          bookings={bookings}
          errorMessage={errorMessage}
          allowedStatuses={[...allowedStatuses]}
          updateBookingStatus={updateBookingStatus}
          cancelBooking={cancelBooking}
          deleteBooking={deleteBooking}
          view="active"
        />
      </div>
    </AdminShell>
  );
}
