import { AdminShell } from "../../components/admin-shell";
import { BookingsClient } from "../bookings-client";
import { getBookingFormOptions, getBookings } from "../bookings-data";
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  updateBookingStatus,
} from "../actions";
import { allowedStatuses } from "../constants";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [
    { bookings, errorMessage },
    { customerOptions, barberOptions, serviceOptions },
  ] = await Promise.all([getBookings(), getBookingFormOptions()]);

  return (
    <AdminShell title="Calendar">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <BookingsClient
          bookings={bookings}
          errorMessage={errorMessage}
          allowedStatuses={[...allowedStatuses]}
          updateBookingStatus={updateBookingStatus}
          cancelBooking={cancelBooking}
          deleteBooking={deleteBooking}
          createBooking={createBooking}
          customerOptions={customerOptions}
          barberOptions={barberOptions}
          serviceOptions={serviceOptions}
          view="calendar"
        />
      </div>
    </AdminShell>
  );
}
