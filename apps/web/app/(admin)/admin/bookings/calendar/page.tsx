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

export const dynamic = "force-dynamic";

export default async function Page() {
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
    <AdminShell title="Calendar">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
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
      </div>
    </AdminShell>
  );
}
