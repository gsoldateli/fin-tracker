import { eq, and, gte, lte, lt, sql } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactions, transactionCategories } from "@/src/db/schema";
import { getTodayCivilDate } from "@/src/lib/date";
import type { Period } from "./schemas";

export type BalanceHistoryRow = {
  date: string;
  balanceCents: number;
};

export type SpendingCategoryRow = {
  categoryName: string;
  totalCents: number;
};

function currentMonthBounds(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${y}-${m}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getPeriodBounds(
  period: Period,
): { start: string; end: string; granularity: "day" | "month" } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const today = getTodayCivilDate();

  switch (period) {
    case "this-month": {
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { start, end, granularity: "day" };
    }
    case "last-90-days": {
      const d = new Date(y, m - 1, now.getDate() - 89);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { start, end: today, granularity: "month" };
    }
    case "ytd": {
      const start = `${y}-01-01`;
      return { start, end: today, granularity: "month" };
    }
  }
}

function generateBuckets(start: string, end: string, granularity: "day" | "month"): string[] {
  const buckets: string[] = [];

  if (granularity === "day") {
    const [sy, sm, sd] = start.split("-").map(Number);
    const [ey, em, ed] = end.split("-").map(Number);
    const current = new Date(sy, sm - 1, sd);
    const last = new Date(ey, em - 1, ed);

    while (current <= last) {
      const by = current.getFullYear();
      const bm = String(current.getMonth() + 1).padStart(2, "0");
      const bd = String(current.getDate()).padStart(2, "0");
      buckets.push(`${by}-${bm}-${bd}`);
      current.setDate(current.getDate() + 1);
    }
  } else {
    const [sy, sm] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    let curY = sy;
    let curM = sm;

    while (curY < ey || (curY === ey && curM <= em)) {
      buckets.push(`${curY}-${String(curM).padStart(2, "0")}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }
  }

  return buckets;
}

export async function getBalanceHistory(db: Database, userId: string, period: Period): Promise<BalanceHistoryRow[]> {
  const { start, end, granularity } = getPeriodBounds(period);
  const buckets = generateBuckets(start, end, granularity);

  const bucketExpr =
    granularity === "day"
      ? transactions.date
      : sql<string>`substr(${transactions.date}, 1, 7)`;

  const [initialRow] = await db
    .select({
      balanceCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), lt(transactions.date, start)));

  const initialBalance = initialRow.balanceCents;

  const rows = await db
    .select({
      bucket: bucketExpr,
      netCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end),
      ),
    )
    .groupBy(bucketExpr)
    .orderBy(bucketExpr);

  const movementMap = new Map(rows.map((r) => [r.bucket, r.netCents]));

  let runningBalance = initialBalance;
  return buckets.map((b) => {
    const net = movementMap.get(b) ?? 0;
    runningBalance = runningBalance + net;
    return { date: b, balanceCents: runningBalance };
  });
}

export async function getSpendingByCategory(
  db: Database,
  userId: string,
  period: Period,
): Promise<SpendingCategoryRow[]> {
  const { start, end } = getPeriodBounds(period);

  const rows = await db
    .select({
      categoryName: sql<string>`COALESCE(${transactionCategories.name}, 'Uncategorized')`,
      totalCents: sql<number>`COALESCE(SUM(ABS(${transactions.amountCents})), 0)`,
    })
    .from(transactions)
    .leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lte(transactions.date, end),
      ),
    )
    .groupBy(transactions.categoryId)
    .orderBy(sql`SUM(ABS(${transactions.amountCents})) DESC`);

  return rows.map((r) => ({
    categoryName: r.categoryName,
    totalCents: r.totalCents,
  }));
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
