"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { BarberOption } from "@/utils/home-data";

const HomeAvailability = dynamic(
  () =>
    import("@/components/customer/home-availability").then((module) => module.HomeAvailability),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/65 px-4 py-7 text-center text-sm text-foreground/70 dark:border-white/20 dark:bg-black/25">
        Loading availability...
      </div>
    ),
  },
);

type HomeAvailabilityDeferredProps = {
  barbers: BarberOption[];
};

export function HomeAvailabilityDeferred({
  barbers,
}: HomeAvailabilityDeferredProps) {
  const [shouldMount, setShouldMount] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "180px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {shouldMount ? (
        <HomeAvailability barbers={barbers} />
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/65 px-4 py-7 text-center text-sm text-foreground/70 dark:border-white/20 dark:bg-black/25">
          Scroll to load live availability.
        </div>
      )}
    </div>
  );
}
