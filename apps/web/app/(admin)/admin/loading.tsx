import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Quick Actions */}
      <div className="grid gap-4 px-5 lg:px-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-13 rounded-xl" />
        ))}
      </div>

      {/* Stats Row 1 */}
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-card">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Card */}
      <div className="px-4 lg:px-6">
        <Card className="border-border/60 bg-card pt-0">
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-border/60 py-6 sm:flex-row sm:items-center">
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <Skeleton className="h-9 w-full sm:w-45" />
              <Skeleton className="h-9 w-full sm:w-40" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            <Skeleton className="h-55 w-full sm:h-62.5" />
          </CardContent>
        </Card>
      </div>

      {/* Stats Row 2 */}
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-card">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
