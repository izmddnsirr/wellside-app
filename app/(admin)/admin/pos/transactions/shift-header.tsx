"use client";

import { useEffect, useState } from "react";
import { createAdminClient } from "@/utils/supabase/client";

type ShiftSummary = {
  id: string;
  shift_code: string | null;
  label: string | null;
};

export function ShiftHeader() {
  const [shift, setShift] = useState<ShiftSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchShift = async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("shifts")
        .select("id, shift_code, label")
        .eq("status", "active")
        .is("end_at", null)
        .order("start_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to load shift header", error);
        setShift(null);
        return;
      }

      setShift(data ?? null);
    };

    fetchShift();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!shift) {
    return null;
  }

  const shiftLabel = shift.shift_code || shift.label || shift.id;

  return (
    <div className="text-base font-medium text-foreground">{shiftLabel}</div>
  );
}
