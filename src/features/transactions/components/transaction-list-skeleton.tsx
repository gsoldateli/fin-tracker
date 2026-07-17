import { Skeleton } from "@/src/components/ui/skeleton";

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="mb-2 h-4 w-32 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-3.5 w-2/5 rounded" />
          </div>
          <Skeleton className="h-4 w-24 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}
