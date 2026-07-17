import { getDb } from "@/src/db/client";
import { getBalanceHistory, getSpendingByCategory } from "@/src/features/dashboard/queries";
import { ChartsSection } from "@/src/features/dashboard/components/charts-section";

export async function ChartsSectionWrapper({
  userId,
}: {
  userId: string;
}) {
  const db = getDb();
  const [balanceHistory, spendingByCategory] = await Promise.all([
    getBalanceHistory(db, userId, "last-90-days"),
    getSpendingByCategory(db, userId, "last-90-days"),
  ]);

  return (
    <ChartsSection
      initialData={{ balanceHistory, spendingByCategory }}
    />
  );
}
