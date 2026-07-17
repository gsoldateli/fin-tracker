import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export function AccountsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl p-3"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col">
              <Skeleton className="mb-1 h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-24 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
