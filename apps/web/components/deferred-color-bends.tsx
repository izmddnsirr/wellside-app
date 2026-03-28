"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
});

export default function DeferredColorBends() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    let cancelled = false;

    const activate = () => {
      if (!cancelled) {
        setEnabled(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(activate, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(activate, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <ColorBends
      colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
      rotation={0}
      speed={0.2}
      scale={1}
      frequency={1}
      warpStrength={1}
      mouseInfluence={1}
      parallax={0.5}
      noise={0.1}
      transparent
      autoRotate={0}
    />
  );
}
