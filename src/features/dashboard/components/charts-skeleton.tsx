import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export function ChartsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-[18px] w-[18px] shrink-0 rounded" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="@container">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 @md:flex-row @md:items-start">
              <div className="flex justify-center @md:w-[55%]">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 @md:flex-col @md:pt-4 @md:w-[45%]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
