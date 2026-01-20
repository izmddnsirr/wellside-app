"use server";

import { getAvailableSlots } from "@/utils/slots-server";

export async function fetchAvailableSlots(barberId: string, dateISO: string) {
  return getAvailableSlots(barberId, dateISO);
}
