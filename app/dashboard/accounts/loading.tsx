import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/src/components/ui/skeleton"

export default function AccountsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-48" />
        <div className="hidden sm:flex sm:gap-4">
          <Skeleton className="h-14 w-44 rounded-full" />
          <Skeleton className="h-14 w-36 rounded-full" />
        </div>
      </header>

      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        </CardContent>
      </Card>

      {/* Mobile skeletons */}
      <div className="space-y-4 lg:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="@container">
              <div className="flex flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:justify-between p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 shrink-0 self-end @[360px]:self-auto" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop skeleton */}
      <Card className="hidden lg:block">
        <div className="border-b border-border px-6 py-4">
          <Skeleton className="h-6 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-0">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-48 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28 shrink-0" />
            <Skeleton className="h-5 w-8 shrink-0" />
          </div>
        ))}
      </Card>
    </div>
  )
}
