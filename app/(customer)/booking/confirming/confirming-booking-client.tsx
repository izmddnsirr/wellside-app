"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";

type ConfirmingBookingClientProps = {
  startedAt: number;
  returnHref: string;
  confirmAction: () => void;
};

const GRACE_PERIOD_MS = 10000;
const PROGRESS_DURATION_MS = 10000;

type Status = "counting" | "cancelling" | "confirming";

export function ConfirmingBookingClient({
  startedAt,
  returnHref,
  confirmAction,
}: ConfirmingBookingClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("counting");
  const [now, setNow] = useState(() => Date.now());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const confirmFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!startedAt) {
      return;
    }
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 120);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, GRACE_PERIOD_MS - elapsedMs);
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = Math.min(elapsedMs / PROGRESS_DURATION_MS, 1);

  const countdownLabel = useMemo(() => {
    if (status === "confirming") {
      return "Finalizing your booking…";
    }
    if (status === "cancelling") {
      return "Cancelling your booking…";
    }
    return `Confirming your booking… You have ${remainingSeconds} seconds to cancel.`;
  }, [status, remainingSeconds]);

  useEffect(() => {
    if (status !== "counting" || hasSubmitted) {
      return;
    }
    if (remainingMs <= 0) {
      setStatus("confirming");
      setHasSubmitted(true);
    }
  }, [remainingMs, status, hasSubmitted]);

  useEffect(() => {
    if (!hasSubmitted) {
      return;
    }
    confirmFormRef.current?.requestSubmit();
  }, [hasSubmitted]);

  const handleCancel = () => {
    if (status !== "counting" || hasSubmitted) {
      return;
    }
    setStatus("cancelling");
    const cancelledParams = new URLSearchParams(returnHref.split("?")[1] ?? "");
    cancelledParams.set("cancelled", "1");
    router.replace(`/booking/review?${cancelledParams.toString()}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-24">
      <div className="flex flex-col gap-4">
        <header className="space-y-4">
          <div className="lg:hidden">
            <BookingFlowActions backHref={returnHref} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
              Confirming booking
            </h1>
            <p className="text-base text-muted-foreground lg:text-lg">
              {countdownLabel}
            </p>
          </div>
        </header>
      </div>

      <section className="rounded-[36px] border border-border/60 bg-card/85 px-6 py-7 shadow-sm sm:px-8">
        <div className="space-y-6">
          <div className="h-4 overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
            <span>Time remaining</span>
            <span className="text-base text-foreground">
              {remainingSeconds}s
            </span>
          </div>
          <form
            className="pt-2"
          >
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full rounded-full border-border text-base font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status !== "counting" || remainingMs <= 0}
              onClick={handleCancel}
            >
              {status === "cancelling" ? "Cancelling..." : "Cancel"}
            </Button>
          </form>
        </div>
      </section>

      <form ref={confirmFormRef} action={confirmAction} className="hidden">
        <button type="submit" aria-hidden="true" tabIndex={-1} />
      </form>
    </div>
  );
}
