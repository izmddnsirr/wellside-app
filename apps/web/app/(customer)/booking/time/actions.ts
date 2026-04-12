"use server";

import { createAdminAuthClient } from "@/utils/supabase/admin";
import { getAvailableSlots } from "@wellside/lib";
import { getClosedDatesMap } from "@/utils/shop-operations";

export async function fetchAvailableSlots(barberId: string, dateISO: string) {
  return getAvailableSlots(createAdminAuthClient(), barberId, dateISO);
}

export async function fetchClosedDates(fromISO: string, toISO: string) {
  const supabase = createAdminAuthClient();
  return getClosedDatesMap(supabase, fromISO, toISO);
}
