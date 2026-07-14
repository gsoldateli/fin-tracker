import { eq, and, asc } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactionCategories } from "@/src/db/schema";

export async function listCategories(
  db: Database,
  userId: string,
  type?: "income" | "expense",
) {
  const conditions = [eq(transactionCategories.userId, userId)];

  if (type) {
    conditions.push(eq(transactionCategories.type, type));
  }

  return db
    .select()
    .from(transactionCategories)
    .where(and(...conditions))
    .orderBy(asc(transactionCategories.name));
}
