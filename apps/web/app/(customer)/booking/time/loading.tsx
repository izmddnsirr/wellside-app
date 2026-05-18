import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-300">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          {/* Left column */}
          <div className="flex flex-col gap-6 lg:flex-[1.4] lg:min-w-0">
            {/* Header */}
            <header className="space-y-4">
              <div className="space-y-1">
                <Skeleton className="h-9 w-48 lg:h-10" />
                <Skeleton className="h-4 w-40 lg:h-5" />
              </div>
            </header>

            {/* Section 1: barber pill + date scroll */}
            <div className="space-y-6">
              {/* Barber selector pill */}
              <Skeleton className="h-11 w-44 rounded-full" />

              {/* Month label + date scroll row */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-28" />
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: time slots */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar (lg only) */}
          <aside className="hidden lg:block lg:flex-1 lg:self-start">
            <div className="sticky top-6 rounded-3xl border border-border/60 bg-card/85 p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
