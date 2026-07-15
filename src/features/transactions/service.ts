import { eq, and } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import type { CreateTransactionInput, UpdateTransactionInput } from "./schemas";
import { getTodayCivilDate } from "@/src/lib/date";

type CreateTransactionError =
  | "INVALID_AMOUNT"
  | "ACCOUNT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_TYPE_MISMATCH";

type UpdateTransactionError =
  | "NOT_FOUND"
  | "WRONG_TYPE"
  | "INVALID_AMOUNT"
  | "ACCOUNT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_TYPE_MISMATCH";

type DeleteTransactionError = "NOT_FOUND" | "WRONG_TYPE";

export async function createTransaction(
  db: Database,
  userId: string,
  input: CreateTransactionInput,
): Promise<
  | { ok: true; value: typeof transactions.$inferSelect }
  | { ok: false; error: CreateTransactionError }
> {
  if (input.amountCents <= 0) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }

  const signedAmount =
    input.type === "expense"
      ? -Math.abs(input.amountCents)
      : Math.abs(input.amountCents);

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)));
  if (!account) {
    return { ok: false, error: "ACCOUNT_NOT_FOUND" };
  }

  if (input.categoryId) {
    const [category] = await db
      .select()
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, input.categoryId),
          eq(transactionCategories.userId, userId),
        ),
      );
    if (!category) {
      return { ok: false, error: "CATEGORY_NOT_FOUND" };
    }
    if (category.type !== input.type) {
      return { ok: false, error: "CATEGORY_TYPE_MISMATCH" };
    }
  }

  const [transaction] = await db
    .insert(transactions)
    .values({
      type: input.type,
      amountCents: signedAmount,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      userId,
      description: input.description ?? null,
      date: input.date ?? getTodayCivilDate(),
    })
    .returning();

  return { ok: true, value: transaction };
}

export async function updateTransaction(
  db: Database,
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput,
): Promise<
  | { ok: true; value: typeof transactions.$inferSelect }
  | { ok: false; error: UpdateTransactionError }
> {
  const [existing] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));

  if (!existing) return { ok: false, error: "NOT_FOUND" };
  if (existing.type !== "income" && existing.type !== "expense")
    return { ok: false, error: "WRONG_TYPE" };

  if (input.amountCents <= 0) return { ok: false, error: "INVALID_AMOUNT" };

  const signedAmount =
    input.type === "expense"
      ? -Math.abs(input.amountCents)
      : Math.abs(input.amountCents);

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)));
  if (!account) return { ok: false, error: "ACCOUNT_NOT_FOUND" };

  if (input.categoryId) {
    const [category] = await db
      .select()
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, input.categoryId),
          eq(transactionCategories.userId, userId),
        ),
      );
    if (!category) return { ok: false, error: "CATEGORY_NOT_FOUND" };
    if (category.type !== input.type)
      return { ok: false, error: "CATEGORY_TYPE_MISMATCH" };
  }

  const [updated] = await db
    .update(transactions)
    .set({
      amountCents: signedAmount,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      date: input.date ?? existing.date,
    })
    .where(eq(transactions.id, transactionId))
    .returning();

  return { ok: true, value: updated };
}

export async function deleteTransaction(
  db: Database,
  userId: string,
  transactionId: string,
): Promise<
  | { ok: true; value: typeof transactions.$inferSelect }
  | { ok: false; error: DeleteTransactionError }
> {
  const [existing] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));

  if (!existing) return { ok: false, error: "NOT_FOUND" };
  if (existing.type !== "income" && existing.type !== "expense")
    return { ok: false, error: "WRONG_TYPE" };

  await db.delete(transactions).where(eq(transactions.id, transactionId));

  return { ok: true, value: existing };
}
