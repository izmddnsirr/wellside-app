"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type IdleCapableWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
});

export default function DeferredColorBends() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const currentWindow = window as IdleCapableWindow;

    if (currentWindow.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    let cancelled = false;

    const activate = () => {
      if (!cancelled) {
        setEnabled(true);
      }
    };

    if (
      typeof currentWindow.requestIdleCallback === "function" &&
      typeof currentWindow.cancelIdleCallback === "function"
    ) {
      const idleId = currentWindow.requestIdleCallback(activate, {
        timeout: 2000,
      });
      return () => {
        cancelled = true;
        currentWindow.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(activate, 400);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
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
