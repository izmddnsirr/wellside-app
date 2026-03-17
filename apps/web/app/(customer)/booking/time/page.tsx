import { createClient } from "@/utils/supabase/server";
import { redirectIfCustomerBookingDisabled } from "../booking-availability";
import SelectTimeClient from "./select-time-client";

export default async function SelectTimePage() {
  await redirectIfCustomerBookingDisabled();

  const supabase = await createClient();
  const { data: barbers } = await supabase
    .from("profiles")
    .select(
      "id, role, first_name, last_name, display_name, avatar_url, barber_level, is_active"
    )
    .eq("is_active", true)
    .eq("role", "barber")
    .order("display_name");

  return <SelectTimeClient barbers={barbers ?? []} />;
}
