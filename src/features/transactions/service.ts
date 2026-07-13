import { eq, and } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import type { CreateTransactionInput } from "./schemas";

type CreateTransactionError =
  | "INVALID_AMOUNT"
  | "ACCOUNT_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_TYPE_MISMATCH";

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
      date: input.date ?? new Date(),
    })
    .returning();

  return { ok: true, value: transaction };
}
