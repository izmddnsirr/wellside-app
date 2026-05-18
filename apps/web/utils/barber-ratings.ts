import "server-only";
import { createAdminAuthClient } from "./supabase/admin";

export type BarberRatingSummary = {
  barberId: string;
  average: number;
  count: number;
};

export async function getBarberRatings(barberIds: string[]): Promise<Map<string, BarberRatingSummary>> {
  if (!barberIds.length) return new Map();

  const supabase = createAdminAuthClient();
  const { data } = await supabase
    .from("barber_reviews")
    .select("barber_id, rating")
    .in("barber_id", barberIds);

  const map = new Map<string, BarberRatingSummary>();

  (data ?? []).forEach(({ barber_id, rating }) => {
    const existing = map.get(barber_id) ?? { barberId: barber_id, average: 0, count: 0 };
    existing.count += 1;
    existing.average = (existing.average * (existing.count - 1) + rating) / existing.count;
    map.set(barber_id, existing);
  });

  return map;
}
