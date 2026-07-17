import { accounts, transactions, transactionCategories } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { getTodayCivilDate } from "@/src/lib/date";
import type { Database } from "@/src/db/client";

export async function createUser(db: Database, email: string) {
  return findOrCreateUser(db, email, false);
}

export async function createAccount(
  db: Database,
  userId: string,
  overrides?: Partial<typeof accounts.$inferInsert>,
) {
  const [acc] = await db
    .insert(accounts)
    .values({
      userId,
      name: "Test Account",
      type: "checking",
      createdAt: new Date(),
      ...overrides,
    })
    .returning();
  return acc;
}

export async function createCategory(
  db: Database,
  userId: string,
  overrides?: Partial<typeof transactionCategories.$inferInsert>,
) {
  const [cat] = await db
    .insert(transactionCategories)
    .values({
      userId,
      name: "Test Category",
      type: "expense",
      ...overrides,
    })
    .returning();
  return cat;
}

export async function insertTransaction(
  db: Database,
  data: {
    userId: string;
    accountId: string;
    type?: "income" | "expense" | "transfer" | "initial_balance";
    amountCents?: number;
    date?: string;
    categoryId?: string | null;
    transferGroupId?: string | null;
    counterpartyAccountId?: string | null;
    description?: string | null;
  },
) {
  const [tx] = await db
    .insert(transactions)
    .values({
      userId: data.userId,
      accountId: data.accountId,
      type: data.type ?? "expense",
      amountCents: data.amountCents ?? -100,
      date: data.date ?? getTodayCivilDate(),
      categoryId: data.categoryId ?? null,
      transferGroupId: data.transferGroupId ?? null,
      counterpartyAccountId: data.counterpartyAccountId ?? null,
      description: data.description ?? null,
    })
    .returning();
  return tx;
}
