"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  className?: string;
};

export function StarRating({ value, onChange, readonly = false, size = 16, className }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer",
            )}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
