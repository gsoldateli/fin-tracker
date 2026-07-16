import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactions } from "@/src/db/schema";

function currentMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${y}-${m}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export async function getCurrentSituation(db: Database, userId: string) {
  const { start, end } = currentMonthBounds();


  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' AND ${transactions.date} >= ${start} AND ${transactions.date} <= ${end} THEN ${transactions.amountCents} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' AND ${transactions.date} >= ${start} AND ${transactions.date} <= ${end} THEN ABS(${transactions.amountCents}) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));


  return {
    totalBalanceCents: row.total,
    monthIncomeCents: row.income,
    monthExpenseCents: row.expense,
  };
}
