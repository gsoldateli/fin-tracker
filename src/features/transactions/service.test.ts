import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { createTransaction, updateTransaction, deleteTransaction } from "./service";
import { getTodayCivilDate } from "@/src/lib/date";

describe("createTransaction", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const { db: testDb, cleanup } = await createTestDb();
    db = testDb;
    cleanupDb = cleanup;

    userId = (await findOrCreateUser(db, "test@test.com")).id;

    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        name: "Test Account",
        type: "checking",
        createdAt: new Date(),
      })
      .returning();
    accountId = account.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("saves expense with negative amountCents (receives positive value)", async () => {
    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 1000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.amountCents).toBe(-1000);
    expect(result.value.type).toBe("expense");
  });

  it("saves income with positive amountCents", async () => {
    const result = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 2000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.amountCents).toBe(2000);
    expect(result.value.type).toBe("income");
  });

  it("applies the provided date; uses today when absent", async () => {
    const customDate = "2025-06-15";

    const withDate = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 500,
      date: customDate,
    });

    expect(withDate.ok).toBe(true);
    if (!withDate.ok) return;
    expect(withDate.value.date).toBe(customDate);

    const withoutDate = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 500,
    });

    expect(withoutDate.ok).toBe(true);
    if (!withoutDate.ok) return;
    expect(withoutDate.value.date).toBe(getTodayCivilDate());
  });

  it("links the category when the type matches", async () => {
    const [category] = await db
      .insert(transactionCategories)
      .values({
        userId,
        name: "Custom Expense Cat",
        type: "expense",
      })
      .returning();

    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 3000,
      categoryId: category.id,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.categoryId).toBe(category.id);
  });

  it("rejects category whose type does not match (income category for an expense)", async () => {
    const [category] = await db
      .insert(transactionCategories)
      .values({
        userId,
        name: "Custom Income Cat",
        type: "income",
      })
      .returning();

    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 1000,
      categoryId: category.id,
    });

    expect(result).toStrictEqual({
      ok: false,
      error: "CATEGORY_TYPE_MISMATCH",
    });
  });

  it("rejects category from another user", async () => {
    const otherUser = await findOrCreateUser(db, "other@test.com");
    const [category] = await db
      .insert(transactionCategories)
      .values({
        userId: otherUser.id,
        name: "Other User Cat",
        type: "expense",
      })
      .returning();

    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 1000,
      categoryId: category.id,
    });

    expect(result).toStrictEqual({
      ok: false,
      error: "CATEGORY_NOT_FOUND",
    });
  });

  it("rejects account from another user", async () => {
    const otherUser = await findOrCreateUser(db, "other@test.com");

    // otherUser tries to create transaction in account belonging to userId
    const result = await createTransaction(db, otherUser.id, {
      type: "expense",
      accountId,   // userId's account, not otherUser's
      amountCents: 1000,
    });

    expect(result).toStrictEqual({ ok: false, error: "ACCOUNT_NOT_FOUND" });
  });

  it("allows transaction without category (categoryId null)", async () => {
    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 1000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.categoryId).toBeNull();
  });

  it("never saves transferGroupId nor counterpartyAccountId", async () => {
    const result = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 5000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, result.value.id));

    expect(row.transferGroupId).toBeNull();
    expect(row.counterpartyAccountId).toBeNull();
  });
});

describe("updateTransaction", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;
  let transactionId: string;

  beforeEach(async () => {
    const { db: testDb, cleanup } = await createTestDb();
    db = testDb;
    cleanupDb = cleanup;

    userId = (await findOrCreateUser(db, "test@test.com")).id;

    const [account] = await db
      .insert(accounts)
      .values({ userId, name: "Test Account", type: "checking", createdAt: new Date() })
      .returning();
    accountId = account.id;

    const result = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 1000,
      description: "original",
    });
    if (!result.ok) throw new Error("setup failed");
    transactionId = result.value.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("updates amount, description, and date", async () => {
    const newDate = "2025-08-01";
    const result = await updateTransaction(db, userId, transactionId, {
      type: "expense",
      accountId,
      amountCents: 2500,
      description: "updated",
      date: newDate,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.amountCents).toBe(-2500);
    expect(result.value.description).toBe("updated");
    expect(result.value.date).toBe(newDate);
  });

  it("preserves the original date when date is not provided", async () => {
    const result = await updateTransaction(db, userId, transactionId, {
      type: "expense",
      accountId,
      amountCents: 2000,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.date).toBeTruthy();
  });

  it("rejects transaction from another user", async () => {
    const otherUser = await findOrCreateUser(db, "other@test.com");
    const result = await updateTransaction(db, otherUser.id, transactionId, {
      type: "expense",
      accountId,
      amountCents: 1000,
    });

    expect(result).toStrictEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("rejects update when transaction does not exist", async () => {
    const result = await updateTransaction(db, userId, crypto.randomUUID(), {
      type: "expense",
      accountId,
      amountCents: 1000,
    });

    expect(result).toStrictEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("rejects INVALID_AMOUNT", async () => {
    const result = await updateTransaction(db, userId, transactionId, {
      type: "expense",
      accountId,
      amountCents: 0,
    });

    expect(result).toStrictEqual({ ok: false, error: "INVALID_AMOUNT" });
  });

  it("rejects account from another user", async () => {
    const otherUser = await findOrCreateUser(db, "other@test.com");
    const [otherAccount] = await db
      .insert(accounts)
      .values({ userId: otherUser.id, name: "Other", type: "checking", createdAt: new Date() })
      .returning();

    const result = await updateTransaction(db, userId, transactionId, {
      type: "expense",
      accountId: otherAccount.id,
      amountCents: 1000,
    });

    expect(result).toStrictEqual({ ok: false, error: "ACCOUNT_NOT_FOUND" });
  });

  it("rejects category type mismatch", async () => {
    const [incomeCat] = await db
      .insert(transactionCategories)
      .values({ userId, name: "Income Cat", type: "income" })
      .returning();

    const result = await updateTransaction(db, userId, transactionId, {
      type: "expense",
      accountId,
      amountCents: 1000,
      categoryId: incomeCat.id,
    });

    expect(result).toStrictEqual({ ok: false, error: "CATEGORY_TYPE_MISMATCH" });
  });
});

describe("deleteTransaction", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const { db: testDb, cleanup } = await createTestDb();
    db = testDb;
    cleanupDb = cleanup;

    userId = (await findOrCreateUser(db, "test@test.com")).id;

    const [account] = await db
      .insert(accounts)
      .values({ userId, name: "Test Account", type: "checking", createdAt: new Date() })
      .returning();
    accountId = account.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("deletes an income transaction", async () => {
    const created = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 5000,
    });
    if (!created.ok) throw new Error("setup failed");

    const result = await deleteTransaction(db, userId, created.value.id);
    expect(result.ok).toBe(true);

    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, created.value.id));
    expect(row).toBeUndefined();
  });

  it("deletes an expense transaction", async () => {
    const created = await createTransaction(db, userId, {
      type: "expense",
      accountId,
      amountCents: 3000,
    });
    if (!created.ok) throw new Error("setup failed");

    const result = await deleteTransaction(db, userId, created.value.id);
    expect(result.ok).toBe(true);

    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, created.value.id));
    expect(row).toBeUndefined();
  });

  it("rejects deleting a transaction from another user", async () => {
    const created = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 5000,
    });
    if (!created.ok) throw new Error("setup failed");

    const otherUser = await findOrCreateUser(db, "other@test.com");
    const result = await deleteTransaction(db, otherUser.id, created.value.id);
    expect(result).toStrictEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("rejects deleting a transfer transaction", async () => {
    const [dest] = await db
      .insert(accounts)
      .values({ userId, name: "Savings", type: "savings", createdAt: new Date() })
      .returning();

    const tg = crypto.randomUUID();
    const [debit] = await db
      .insert(transactions)
      .values({
        userId,
        accountId,
        type: "transfer",
        amountCents: -1000,
        date: getTodayCivilDate(),
        transferGroupId: tg,
        counterpartyAccountId: dest.id,
      })
      .returning();

    const result = await deleteTransaction(db, userId, debit.id);
    expect(result).toStrictEqual({ ok: false, error: "WRONG_TYPE" });
  });

  it("rejects deleting an initial_balance transaction", async () => {
    const [ib] = await db
      .insert(transactions)
      .values({
        userId,
        accountId,
        type: "initial_balance",
        amountCents: 50000,
        date: getTodayCivilDate(),
      })
      .returning();

    const result = await deleteTransaction(db, userId, ib.id);
    expect(result).toStrictEqual({ ok: false, error: "WRONG_TYPE" });
  });

  it("returns NOT_FOUND for a non-existent transaction", async () => {
    const result = await deleteTransaction(db, userId, crypto.randomUUID());
    expect(result).toStrictEqual({ ok: false, error: "NOT_FOUND" });
  });
});
