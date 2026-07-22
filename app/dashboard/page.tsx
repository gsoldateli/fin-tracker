import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/src/lib/session";
import { getDb } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { DashboardHeader } from "@/src/features/dashboard/components/dashboard-header";
import { SituationCardsSection } from "@/src/features/dashboard/components/situation-cards-section";
import { ChartsSectionWrapper } from "@/src/features/dashboard/components/charts-section-wrapper";
import { RecentTransactionsSection } from "@/src/features/dashboard/components/recent-transactions-section";
import { SituationCardsSkeleton } from "@/src/features/dashboard/components/situation-cards-skeleton";
import { ChartsSkeleton } from "@/src/features/dashboard/components/charts-skeleton";
import { RecentTransactionsSkeleton } from "@/src/features/dashboard/components/recent-transactions-skeleton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6">
      <DashboardHeader email={user.email} />

      <Suspense fallback={<SituationCardsSkeleton />}>
        <SituationCardsSection userId={session.userId} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSectionWrapper userId={session.userId} />
      </Suspense>

      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <RecentTransactionsSection userId={session.userId} />
      </Suspense>
    </div>
  );
}
