"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";
import { transferSchema } from "@/src/features/accounts/schemas";
import { transfer } from "@/src/features/accounts/service";
import { createTransactionSchema, updateTransactionSchema } from "@/src/features/transactions/schemas";
import { createTransaction, updateTransaction, deleteTransaction } from "@/src/features/transactions/service";
import type { ActionState } from "@/src/features/accounts/actions";
import { getTodayCivilDate } from "@/src/lib/date";
import { listTransactions, type TransactionWithRelations, type ListTransactionsOpts } from "./queries";

export async function transferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const parsed = transferSchema.safeParse({
    fromId: formData.get("fromId"),
    toId: formData.get("toId"),
    amountCents: Number(formData.get("amountCents")),
    description: formData.get("description")?.toString()?.trim() || undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0].path[0] as string;
    return { fieldErrors: { [field]: parsed.error.issues[0].message } };
  }

  const db = getDb();
  const result = await transfer(db, session.userId, parsed.data);

  if (!result.ok) {
    switch (result.error) {
      case "INSUFFICIENT_FUNDS":
        return { error: "Insufficient balance" };
      case "SAME_ACCOUNT":
        return { error: "Cannot transfer to the same account" };
      case "ACCOUNT_NOT_FOUND":
        return { error: "Account not found" };
      case "INVALID_AMOUNT":
        return { error: "Invalid amount" };
    }
  }

  logger.info({
    action: "transfer",
    userId: session.userId,
    transferGroupId: result.value.transferGroupId,
  });

  revalidatePath("/accounts");

  return {};
}

export async function saveTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const transactionId = formData.get("transactionId")?.toString();
  const schema = transactionId ? updateTransactionSchema : createTransactionSchema;

  const parsed = schema.safeParse({
    type: formData.get("type"),
    amountCents: Number(formData.get("amountCents")),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId")?.toString() || undefined,
    date: formData.get("date")?.toString() || undefined,
    description: formData.get("description")?.toString()?.trim() || undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0].path[0] as string;
    return { fieldErrors: { [field]: parsed.error.issues[0].message } };
  }

  const db = getDb();
  const result = transactionId
    ? await updateTransaction(db, session.userId, transactionId, parsed.data)
    : await createTransaction(db, session.userId, parsed.data);

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  logger.info({
    action: transactionId ? "update_transaction" : "create_transaction",
    userId: session.userId,
    transactionId: result.value.id,
  });

  return {
    success: true,
    transactionId: result.value.id,
    action: transactionId ? "update" : "create",
    type: parsed.data.type,
    amountCents: parsed.data.amountCents,
    accountId: parsed.data.accountId,
    categoryId: parsed.data.categoryId ?? null,
    date: parsed.data.date ?? getTodayCivilDate(),
    description: parsed.data.description ?? null,
  };
}

export async function deleteTransactionAction(
  transactionId: string,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const db = getDb();
  const result = await deleteTransaction(db, session.userId, transactionId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  revalidatePath("/transactions");

  logger.info({ action: "delete_transaction", userId: session.userId, transactionId });

  return {};
}

export async function loadMoreTransactions(
  filters: {
    period?: string;
    type?: string;
    account?: string;
    category?: string;
    q?: string;
    from?: string;
    to?: string;
  },
  cursor?: { date: string; createdAt: number; id: string } | null,
): Promise<{ items: TransactionWithRelations[]; nextCursor: { date: string; createdAt: number; id: string } | null }> {
  const session = await getSession();
  if (!session) return { items: [], nextCursor: null };

  const opts: ListTransactionsOpts = {};

  if (filters.period) opts.period = filters.period as ListTransactionsOpts["period"];
  if (filters.type) opts.type = filters.type as ListTransactionsOpts["type"];
  if (filters.account) opts.accountId = filters.account;
  if (filters.category) opts.categoryId = filters.category;
  if (filters.q) opts.search = filters.q;
  if (filters.from) opts.from = filters.from;
  if (filters.to) opts.to = filters.to;
  if (cursor) opts.cursor = cursor;

  return listTransactions(getDb(), session.userId, opts);
}
