import { Skeleton } from "@/src/components/ui/skeleton";

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="mb-2 h-4 w-32 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="@container rounded-2xl bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:gap-4 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/5 rounded" />
                <Skeleton className="h-3.5 w-2/5 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-24 shrink-0 rounded self-end @[360px]:self-auto @[360px]:ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
