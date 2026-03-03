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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-1">
          <h2 className="font-(--font-display) text-2xl leading-tight sm:text-[1.75rem]">
            Today&apos;s slots
          </h2>
          <p className="text-sm text-foreground/70">
            Choose a barber and book the next available slot.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-center text-xs font-semibold text-foreground/90 backdrop-blur-md sm:text-left dark:border-white/20 dark:bg-black/30">
            {slotsLabel}
          </span>
          {barbers.length ? (
            <Select value={resolvedSelectedId} onValueChange={setSelectedId}>
              <SelectTrigger
                className="h-10 w-full rounded-full border-border/60 bg-background/70 text-sm text-foreground/95 backdrop-blur-md sm:min-w-44 sm:w-auto dark:border-white/20 dark:bg-black/30"
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
                    className="rounded-lg text-sm"
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
      </div>

      {effectiveSlotState.isLoading ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/65 px-4 py-7 text-center text-sm text-foreground/70 dark:border-white/20 dark:bg-black/25">
          Loading slots...
        </div>
      ) : effectiveSlotState.error ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/65 px-4 py-7 text-center text-sm text-foreground/70 dark:border-white/20 dark:bg-black/25">
          {effectiveSlotState.error}
        </div>
      ) : effectiveSlotState.slots.length ? (
        <div className="grid max-h-72 gap-3 overflow-y-auto pr-1">
          {effectiveSlotState.slots.map((slot) => (
            <button
              key={slot.start_at}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-background/65 px-4 py-3.5 text-left transition-colors hover:border-border hover:bg-muted/80 dark:border-white/15 dark:bg-black/25 dark:hover:border-white/25 dark:hover:bg-black/40"
            >
              <span className="text-lg font-semibold leading-none">{slot.label}</span>
              <span className="text-sm font-semibold text-foreground/65 transition-colors group-hover:text-foreground/95">
                Book now
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/65 px-4 py-7 text-center text-sm text-foreground/70 dark:border-white/20 dark:bg-black/25">
          No available slots yet.
        </div>
      )}
    </div>
  );
}
