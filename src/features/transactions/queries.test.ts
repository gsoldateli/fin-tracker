import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { listTransactions } from "./queries";
import { getTodayCivilDate } from "@/src/lib/date";

import { createTransaction } from "./service";
import { createAccount } from "../accounts/service";


describe("listTransactions", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;
  let categoryExpenseId: string;
  let categoryIncomeId: string;

  beforeEach(async () => {
    const sut = await createTestDb();
    db = sut.db;
    cleanupDb = sut.cleanup;

    userId = (await findOrCreateUser(db, "test@test.com", false)).id;

    const [acc] = await db
      .insert(accounts)
      .values({ userId, name: "Checking", type: "checking", createdAt: new Date() })
      .returning();
    accountId = acc.id;

    const [catExpense] = await db
      .insert(transactionCategories)
      .values({ userId, name: "Food_Q", type: "expense" })
      .returning();
    categoryExpenseId = catExpense.id;

    const [catIncome] = await db
      .insert(transactionCategories)
      .values({ userId, name: "Salary_Q", type: "income" })
      .returning();
    categoryIncomeId = catIncome.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("returns at most limit items; nextCursor null when fewer items", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 1000, date: "2025-07-01", description: "tx1" },
      { userId, accountId, type: "income", amountCents: 2000, date: "2025-07-02", description: "tx2" },
    ]);

    const result = await listTransactions(db, userId, { limit: 3 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it("second page via cursor does not repeat items from the first", async () => {
    for (let i = 0; i < 5; i++) {
      await db.insert(transactions).values({
        userId, accountId, type: "income", amountCents: 1000 * (i + 1),
        date: `2025-07-${String(i + 1).padStart(2, '0')}`,
        description: `tx${i + 1}`,
      });
    }

    const page1 = await listTransactions(db, userId, { limit: 3 });
    expect(page1.items).toHaveLength(3);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await listTransactions(db, userId, { limit: 3, cursor: page1.nextCursor! });
    expect(page2.items).toHaveLength(2);
    expect(page2.nextCursor).toBeNull();

    const allIds = [...page1.items.map((i) => i.id), ...page2.items.map((i) => i.id)];
    expect(new Set(allIds).size).toBe(5);
  });

  it("tiebreak by createdAt: same date pagination skips no items", async () => {
    const sameDate = "2025-07-01";
    const inserted: { id: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const [row] = await db
        .insert(transactions)
        .values({
          userId, accountId, type: "income", amountCents: 1000 * (i + 1),
          date: sameDate, description: `tx${i + 1}`,
          createdAt: new Date(2025, 6, 1, 0, 0, i),
        })
        .returning({ id: transactions.id });
      inserted.push(row);
    }

    const page1 = await listTransactions(db, userId, { limit: 2 });
    expect(page1.items).toHaveLength(2);

    const page2 = await listTransactions(db, userId, { limit: 2, cursor: page1.nextCursor! });
    expect(page2.items).toHaveLength(2);

    const allIds = [...page1.items.map((i) => i.id), ...page2.items.map((i) => i.id)];
    expect(new Set(allIds).size).toBe(4);
  });

  it("type filter restricts to income", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 1000, date: "2025-07-01", description: "salary" },
      { userId, accountId, type: "expense", amountCents: -500, date: "2025-07-02", description: "market" },
    ]);

    const result = await listTransactions(db, userId, { type: "income" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("salary");
  });

  it("accountId filter restricts", async () => {
    const [acc2] = await db
      .insert(accounts)
      .values({ userId, name: "Savings", type: "savings", createdAt: new Date() })
      .returning();

    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 1000, date: "2025-07-01" },
      { userId, accountId: acc2.id, type: "income", amountCents: 2000, date: "2025-07-02" },
    ]);

    const result = await listTransactions(db, userId, { accountId });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].accountId).toBe(accountId);
  });

  it("categoryId filter restricts", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -500, date: "2025-07-01", description: "food", categoryId: categoryExpenseId },
      { userId, accountId, type: "income", amountCents: 1000, date: "2025-07-02", description: "salary", categoryId: categoryIncomeId },
    ]);

    const result = await listTransactions(db, userId, { categoryId: categoryExpenseId });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("food");
  });

  it("search filter queries description (LIKE)", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -500, date: "2025-07-01", description: "supermarket" },
      { userId, accountId, type: "expense", amountCents: -100, date: "2025-07-02", description: "bakery" },
    ]);

    const result = await listTransactions(db, userId, { search: "market" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("supermarket");
  });

  it("only returns transactions for the userId", async () => {
    const otherUser = await findOrCreateUser(db, "other@test.com", false);
    await db.insert(transactions).values([
      { userId: otherUser.id, accountId, type: "income", amountCents: 9999, date: "2025-07-01" },
    ]);

    const result = await listTransactions(db, userId);
    expect(result.items).toHaveLength(0);
  });

  it("does not include initial_balance in the general listing", async () => {
    const accWithInitialBalance = await createAccount(db, userId, { name: "Acc with initial balance", type: "checking", initialBalanceCents: 5000 });
    let accountId: string;
    if (accWithInitialBalance.ok) {
      accountId = accWithInitialBalance.value.id;
    } else {
      throw new Error("error when creating account");
    }
    // await createTransaction(db,  accountId, userId, type: "income", amountCents: 1000 });
    await createTransaction(db, userId, {
      accountId,
      amountCents: 1000,
      date: getTodayCivilDate(),
      type: "income",
      description: "test"
    })

    const { items } = await listTransactions(db, userId, {});

    expect(items.every(t => t.type !== "initial_balance")).toBe(true);
  });

  it("transfer appears ONCE in the general listing (no account filter)", async () => {
    const [dest] = await db
      .insert(accounts)
      .values({ userId, name: "Savings", type: "savings", createdAt: new Date() })
      .returning();
    const tg = crypto.randomUUID();

    await db.insert(transactions).values([
      { userId, accountId, type: "transfer", amountCents: -1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: dest.id, description: "transfer" },
      { userId, accountId: dest.id, type: "transfer", amountCents: 1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: accountId, description: "transfer" },
    ]);

    const result = await listTransactions(db, userId, { type: "transfer" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amountCents).toBeLessThan(0);
    expect(result.items[0].counterpartyAccountId).toBe(dest.id);
  });

  it("transfer filtered by source shows outgoing", async () => {
    const [dest] = await db
      .insert(accounts)
      .values({ userId, name: "Savings", type: "savings", createdAt: new Date() })
      .returning();
    const tg = crypto.randomUUID();

    await db.insert(transactions).values([
      { userId, accountId, type: "transfer", amountCents: -1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: dest.id },
      { userId, accountId: dest.id, type: "transfer", amountCents: 1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: accountId },
    ]);

    const result = await listTransactions(db, userId, { type: "transfer", accountId });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amountCents).toBe(-1000);
  });

  it("transfer filtered by destination shows incoming", async () => {
    const [dest] = await db
      .insert(accounts)
      .values({ userId, name: "Savings", type: "savings", createdAt: new Date() })
      .returning();
    const tg = crypto.randomUUID();

    await db.insert(transactions).values([
      { userId, accountId, type: "transfer", amountCents: -1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: dest.id },
      { userId, accountId: dest.id, type: "transfer", amountCents: 1000, date: "2025-07-01", transferGroupId: tg, counterpartyAccountId: accountId },
    ]);

    const result = await listTransactions(db, userId, { type: "transfer", accountId: dest.id });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amountCents).toBe(1000);
  });

  it("this-month preset resolves to the current month", async () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-15`;

    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 1000, date: thisMonth, description: "this month" },
      { userId, accountId, type: "income", amountCents: 2000, date: lastMonth, description: "last month" },
    ]);

    const result = await listTransactions(db, userId, { period: "this-month" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("this month");
  });
});
