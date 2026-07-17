import { Card } from "@/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export function SituationCardsSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="bg-primary/5 border-primary/10">
        <div className="p-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="h-8 w-36" />
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
      </Card>
    </section>
  );
}
