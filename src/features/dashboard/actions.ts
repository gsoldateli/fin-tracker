"use server";

import { getSession } from "@/src/lib/session";
import { getDb } from "@/src/db/client";
import { getBalanceHistory, getSpendingByCategory } from "./queries";
import { periodSchema } from "./schemas";

export async function getDashboardCharts(period: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = periodSchema.parse(period);
  const db = getDb();

  const [balanceHistory, spendingByCategory] = await Promise.all([
    getBalanceHistory(db, session.userId, parsed),
    getSpendingByCategory(db, session.userId, parsed),
  ]);

  return { balanceHistory, spendingByCategory };
}
