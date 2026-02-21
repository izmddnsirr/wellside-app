"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableSlots, type Slot } from "@/utils/slots";

type BarberOption = {
  id: string;
  name: string;
};

type HomeAvailabilityProps = {
  barbers: BarberOption[];
};

const TIME_ZONE = "Asia/Kuala_Lumpur";

type SlotState = {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;
};

const getTodayISO = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

export function HomeAvailability({ barbers }: HomeAvailabilityProps) {
  const [selectedId, setSelectedId] = useState(barbers[0]?.id ?? "");
  const dateISO = useMemo(() => getTodayISO(), []);
  const slotsCacheRef = useRef(new Map<string, Slot[]>());
  const [slotState, setSlotState] = useState<SlotState>({
    slots: [],
    isLoading: false,
    error: null,
  });
  const resolvedSelectedId = useMemo(() => {
    if (!barbers.length) {
      return "";
    }
    if (selectedId && barbers.some((barber) => barber.id === selectedId)) {
      return selectedId;
    }
    return barbers[0]?.id ?? "";
  }, [barbers, selectedId]);

  useEffect(() => {
    let isActive = true;

    if (!resolvedSelectedId) {
      return () => {
        isActive = false;
      };
    }

    const cacheKey = `${resolvedSelectedId}|${dateISO}`;
    const cachedSlots = slotsCacheRef.current.get(cacheKey);
    if (cachedSlots) {
      queueMicrotask(() => {
        if (isActive) {
          setSlotState({ slots: cachedSlots, isLoading: false, error: null });
        }
      });
      return () => {
        isActive = false;
      };
    }

    queueMicrotask(() => {
      if (isActive) {
        setSlotState((prev) => ({ ...prev, isLoading: true, error: null }));
      }
    });

    getAvailableSlots(resolvedSelectedId, dateISO)
      .then((slots) => {
        if (isActive) {
          slotsCacheRef.current.set(cacheKey, slots);
          setSlotState({ slots, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (isActive) {
          setSlotState({
            slots: [],
            isLoading: false,
            error: "Unable to load available slots right now.",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [dateISO, resolvedSelectedId]);

  const effectiveSlotState = resolvedSelectedId
    ? slotState
    : { slots: [], isLoading: false, error: null };
  const slotsLabel = effectiveSlotState.slots.length
    ? `${effectiveSlotState.slots.length} slots left`
    : "No slots";

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.2em] text-muted-foreground">
          Today
        </p>
        <span className="rounded-full border border-border px-3 py-1 text-xs">
          {slotsLabel}
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-(--font-display) text-2xl">Your barber</h2>
          {barbers.length ? (
            <Select value={resolvedSelectedId} onValueChange={setSelectedId}>
              <SelectTrigger
                className="h-9 w-40 rounded-full text-xs"
                size="sm"
                aria-label="Select barber"
              >
                <SelectValue placeholder="Select barber" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {barbers.map((barber) => (
                  <SelectItem
                    key={barber.id}
                    value={barber.id}
                    className="rounded-lg text-xs"
                  >
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">
              No barbers available
            </span>
          )}
        </div>
        {effectiveSlotState.isLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Loading slots...
          </div>
        ) : effectiveSlotState.error ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            {effectiveSlotState.error}
          </div>
        ) : effectiveSlotState.slots.length ? (
          <div className="grid max-h-[260px] gap-3 overflow-y-auto pr-1">
            {effectiveSlotState.slots.map((slot) => (
              <button
                key={slot.start_at}
                className="flex items-center justify-between rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm"
              >
                <span>{slot.label}</span>
                <span className="text-muted-foreground">Book now</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No available slots yet.
          </div>
        )}
      </div>
    </>
  );
}
