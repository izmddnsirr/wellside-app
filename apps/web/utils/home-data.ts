import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

type Service = {
  id: string;
  name: string;
  base_price: number | null;
  duration_minutes: number | null;
};

type BarberOption = {
  id: string;
  name: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const getPublicSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getCachedActiveServices = unstable_cache(
  async (): Promise<Service[]> => {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, base_price, duration_minutes")
      .eq("is_active", true)
      .not("base_price", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return data ?? [];
  },
  ["home:services"],
  { revalidate: 300 },
);

export const getCachedActiveBarbers = unstable_cache(
  async (): Promise<BarberOption[]> => {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .eq("is_active", true)
      .eq("role", "barber")
      .order("display_name");

    if (error) {
      return [];
    }

    return (data ?? []).map((barber) => {
      const name =
        barber.display_name?.trim() ||
        [barber.first_name, barber.last_name].filter(Boolean).join(" ").trim() ||
        "Barber";

      return {
        id: barber.id,
        name,
      };
    });
  },
  ["home:barbers"],
  { revalidate: 300 },
);

export const getCachedTotalBookingsCount = unstable_cache(
  async (): Promise<number> => {
    const supabase = getPublicSupabaseClient();
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .neq("status", "cancelled");

    if (error || typeof count !== "number") {
      return 0;
    }

    return count;
  },
  ["home:total-bookings"],
  { revalidate: 300 },
);

export type { BarberOption, Service };
