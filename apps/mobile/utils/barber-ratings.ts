import { supabase } from "./supabase";

export type BarberRatingSummary = {
  barberId: string;
  average: number;
  count: number;
};

export async function getBarberRatings(
  barberIds: string[]
): Promise<Map<string, BarberRatingSummary>> {
  if (!barberIds.length) {
    return new Map();
  }

  const { data } = await supabase
    .from("barber_reviews")
    .select("barber_id,rating")
    .in("barber_id", barberIds);

  const ratings = new Map<string, BarberRatingSummary>();

  (data ?? []).forEach(({ barber_id, rating }) => {
    const existing = ratings.get(barber_id) ?? {
      barberId: barber_id,
      average: 0,
      count: 0,
    };
    existing.count += 1;
    existing.average =
      (existing.average * (existing.count - 1) + rating) / existing.count;
    ratings.set(barber_id, existing);
  });

  return ratings;
}
