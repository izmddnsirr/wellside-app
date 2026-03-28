"use client";

import { useEffect, useMemo, useState } from "react";

type TotalBookingsCounterProps = {
  value: number;
};

const DURATION_MS = 1200;

export function TotalBookingsCounter({ value }: TotalBookingsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Math.floor(value));
    const start = performance.now();
    let rafId = 0;

    const tick = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [value]);

  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat("en-US").format(displayValue);
  }, [displayValue]);

  return (
    <span className="font-bold text-foreground tabular-nums">{formattedValue}</span>
  );
}
