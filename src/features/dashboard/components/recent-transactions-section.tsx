import { getDb } from "@/src/db/client";
import { listTransactions } from "@/src/features/transactions/queries";
import { RecentTransactions } from "@/src/features/dashboard/components/recent-transactions";

export async function RecentTransactionsSection({
  userId,
}: {
  userId: string;
}) {
  const db = getDb();
  const result = await listTransactions(db, userId, { limit: 5 });

  return <RecentTransactions transactions={result.items} />;
}
