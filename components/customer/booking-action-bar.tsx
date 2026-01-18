import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type BookingActionBarProps = {
  backHref?: string;
  backLabel?: string;
  closeHref?: string;
  closeLabel?: string;
};

export function BookingActionBar({
  backHref,
  backLabel = "Back",
  closeHref = "/booking",
  closeLabel = "Close",
}: BookingActionBarProps) {
  const containerClass = backHref
    ? "flex items-center justify-between"
    : "flex items-center justify-end";

  return (
    <div className="sticky top-0 bg-[#f4f6fb]/90 pb-4 pt-4 backdrop-blur">
      <div className={containerClass}>
        {backHref ? (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full border-slate-200/80 bg-white/70 text-slate-700 shadow-none"
          >
            <Link href={backHref} aria-label={backLabel}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        ) : null}
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-slate-200/80 bg-white/70 text-slate-700 shadow-none"
        >
          <Link href={closeHref} aria-label={closeLabel}>
            <X className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
