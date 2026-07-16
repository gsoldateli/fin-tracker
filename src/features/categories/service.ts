import { eq, and, sql } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactionCategories, transactions } from "@/src/db/schema";
import type { CreateCategoryInput } from "./schemas";

export async function createCategory(
  db: Database,
  userId: string,
  input: CreateCategoryInput,
): Promise<
  | { ok: true; value: typeof transactionCategories.$inferSelect; created: boolean }
  | { ok: false; error: "INVALID_NAME" }
> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "INVALID_NAME" };
  }

  const [existing] = await db
    .select()
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.userId, userId),
        eq(transactionCategories.type, input.type),
        eq(sql`lower(${transactionCategories.name})`, name.toLowerCase()),
      ),
    );

  if (existing) {
    return { ok: true, value: existing, created: false };
  }

  const [category] = await db
    .insert(transactionCategories)
    .values({ userId, name, type: input.type })
    .returning();

  return { ok: true, value: category, created: true };
}

export async function deleteCategory(
  db: Database,
  userId: string,
  categoryId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: "CATEGORY_NOT_FOUND" | "CATEGORY_IN_USE" }
> {
  const [category] = await db
    .select()
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.id, categoryId),
        eq(transactionCategories.userId, userId),
      ),
    );

  if (!category) {
    return { ok: false, error: "CATEGORY_NOT_FOUND" };
  }

  const [inUse] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId));

  if (inUse.count > 0) {
    return { ok: false, error: "CATEGORY_IN_USE" };
  }

  await db
    .delete(transactionCategories)
    .where(eq(transactionCategories.id, categoryId));

  return { ok: true };
}
