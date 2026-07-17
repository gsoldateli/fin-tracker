import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export function RecentTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-6">
          <section>
            <Skeleton className="mb-2 ml-1 h-3 w-16" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </section>
          <section>
            <Skeleton className="mb-2 ml-1 h-3 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-4">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Skeleton className="mb-1.5 h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-20 shrink-0" />
    </div>
  );
}
