import { eq, and, desc, lt, or, like, gte, lte, not, type SQL } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactions, accounts, transactionCategories } from "@/src/db/schema";

const counterpartyAccount = aliasedTable(accounts, "counterparty_account");

export type TransactionWithRelations = {
  id: string;
  type: "income" | "expense" | "transfer" | "initial_balance";
  amountCents: number;
  description: string | null;
  date: string;
  createdAt: Date;
  accountId: string;
  accountName: string;
  accountType: string;
  categoryId: string | null;
  categoryName: string | null;
  counterpartyAccountId: string | null;
  counterpartyAccountName: string | null;
  transferGroupId: string | null;
};

export type ListTransactionsOpts = {
  period?: "this-month" | "last-90-days" | "ytd";
  from?: string;
  to?: string;
  type?: "income" | "expense" | "transfer";
  accountId?: string;
  categoryId?: string;
  search?: string;
  cursor?: { date: string; createdAt: number; id: string };
  limit?: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function resolvePeriod(period: ListTransactionsOpts["period"]): { from: string; to: string } | null {
  const now = new Date();
  switch (period) {
    case "this-month": {
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      return { from, to };
    }
    case "last-90-days": {
      const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const to = now;
      return { from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`, to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}` };
    }
    case "ytd": {
      const from = `${now.getFullYear()}-01-01`;
      const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      return { from, to };
    }
    default:
      return null;
  }
}

export async function listTransactions(
  db: Database,
  userId: string,
  opts: ListTransactionsOpts = {},
): Promise<{ items: TransactionWithRelations[]; nextCursor: { date: string; createdAt: number; id: string } | null }> {
  const limit = Math.min(opts.limit ?? 20, 100);
  const conditions = [eq(transactions.userId, userId)];

  if (opts.period) {
    const range = resolvePeriod(opts.period);
    if (range) {
      conditions.push(gte(transactions.date, range.from));
      conditions.push(lte(transactions.date, range.to));
    }
  } else {
    if (opts.from) conditions.push(gte(transactions.date, opts.from));
    if (opts.to) conditions.push(lte(transactions.date, opts.to));
  }

  if (opts.type) {
    conditions.push(eq(transactions.type, opts.type));
    if (opts.type === "transfer" && !opts.accountId) {
      conditions.push(lt(transactions.amountCents, 0));
    }
  }

  if (opts.accountId) {
    conditions.push(eq(transactions.accountId, opts.accountId));
  }

  if (opts.categoryId) {
    conditions.push(eq(transactions.categoryId, opts.categoryId));
  }

  if (opts.search) {
    conditions.push(like(transactions.description, `%${opts.search}%`));
  }

  if (opts.cursor) {
    const cursorCondition = or(
      lt(transactions.date, opts.cursor.date) as SQL,
      and(eq(transactions.date, opts.cursor.date) as SQL, lt(transactions.createdAt, new Date(opts.cursor.createdAt)) as SQL) as SQL,
      and(eq(transactions.date, opts.cursor.date) as SQL, eq(transactions.createdAt, new Date(opts.cursor.createdAt)) as SQL, lt(transactions.id, opts.cursor.id) as SQL) as SQL,
    ) as SQL;
    conditions.push(cursorCondition);
  }

  conditions.push(not(eq(transactions.type, "initial_balance")));

  const rows = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      date: transactions.date,
      createdAt: transactions.createdAt,
      accountId: transactions.accountId,
      accountName: accounts.name,
      accountType: accounts.type,
      categoryId: transactions.categoryId,
      categoryName: transactionCategories.name,
      counterpartyAccountId: transactions.counterpartyAccountId,
      counterpartyAccountName: counterpartyAccount.name,
      transferGroupId: transactions.transferGroupId,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
    .leftJoin(counterpartyAccount, eq(transactions.counterpartyAccountId, counterpartyAccount.id))
    .where(and(...conditions.filter((c): c is SQL => c !== undefined)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt), desc(transactions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const last = rows.at(-1);
  const nextCursor = hasMore && last ? { date: last.date, createdAt: last.createdAt.getTime(), id: last.id } : null;

  return { items: rows as TransactionWithRelations[], nextCursor };
}
