"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TvAccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(searchParams.get("error") === "invalid");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setError(false);
    router.push(`/tv/${pin}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-card shadow-sm px-8 py-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">TV Display Access</h1>
            <p className="text-[13px] text-muted-foreground">
              Enter the 6-digit PIN to access the TV display. You can find this PIN in the dashboard queue tab.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pin" className="text-[13px] font-medium text-foreground">
                6-Digit PIN
              </label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPin(val);
                  setError(false);
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-center text-[15px] tracking-[0.3em] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error && (
                <p className="text-[12px] text-destructive">Invalid PIN. Please try again.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pin.length !== 6}
              className="w-full rounded-lg bg-foreground text-background text-[14px] font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Access Display
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TvAccessPage() {
  return (
    <Suspense>
      <TvAccessForm />
    </Suspense>
  );
}
