import { Suspense } from "react";
import SelectTimeClient from "./select-time-client";

export default function SelectTimePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-xl p-6 text-sm text-slate-500 lg:max-w-[1200px]">
          Loading time selection...
        </div>
      }
    >
      <SelectTimeClient />
    </Suspense>
  );
}
