import { redirect } from "next/navigation";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { loadShopOperatingRules } from "@/utils/shop-operations";

export const isCustomerBookingEnabled = async () => {
  const rules = await loadShopOperatingRules(createAdminAuthClient());
  return rules.bookingEnabled;
};

export const redirectIfCustomerBookingDisabled = async () => {
  const bookingEnabled = await isCustomerBookingEnabled();
  if (!bookingEnabled) {
    redirect("/booking?booking_disabled=1");
  }
};
