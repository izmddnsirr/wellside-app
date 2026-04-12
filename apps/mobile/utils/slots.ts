import { supabase } from "./supabase";
import { getAvailableSlots as _getAvailableSlots, type Slot } from "@wellside/lib";

export async function getAvailableSlots(
  barberId: string,
  dateISO: string,
): Promise<Slot[]> {
  return _getAvailableSlots(supabase, barberId, dateISO);
}

export type { Slot };
