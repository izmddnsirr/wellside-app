import { createClient } from "@/utils/supabase/client";
import { getAvailableSlots as _getAvailableSlots, type Slot } from "@wellside/lib";

export async function getAvailableSlots(
  barberId: string,
  dateISO: string,
): Promise<Slot[]> {
  const supabase = createClient();
  return _getAvailableSlots(supabase, barberId, dateISO);
}

export type { Slot };
