"use server";

import { createAdminAuthClient } from "@/utils/supabase/admin";
import { getAvailableSlots } from "@/utils/slots-server";
import { getClosedDatesMap } from "@/utils/shop-operations";

export async function fetchAvailableSlots(barberId: string, dateISO: string) {
  return getAvailableSlots(barberId, dateISO);
}

export async function fetchClosedDates(fromISO: string, toISO: string) {
  const supabase = createAdminAuthClient();
  return getClosedDatesMap(supabase, fromISO, toISO);
}
