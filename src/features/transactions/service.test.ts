import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { createTransaction } from "./service";

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
    const customDate = new Date("2025-06-15T12:00:00Z");

    const withDate = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 500,
      date: customDate,
    });

    expect(withDate.ok).toBe(true);
    if (!withDate.ok) return;
    expect(withDate.value.date.getTime()).toBe(customDate.getTime());

    const withoutDate = await createTransaction(db, userId, {
      type: "income",
      accountId,
      amountCents: 500,
    });

    expect(withoutDate.ok).toBe(true);
    if (!withoutDate.ok) return;
    const now = new Date();
    expect(withoutDate.value.date.getTime()).toBeGreaterThanOrEqual(
      now.getTime() - 1000,
    );
    expect(withoutDate.value.date.getTime()).toBeLessThanOrEqual(
      now.getTime() + 1000,
    );
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
