import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border/60 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}
