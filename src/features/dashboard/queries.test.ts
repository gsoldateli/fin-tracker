import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { getCurrentSituation, getBalanceHistory, getSpendingByCategory } from "./queries";
import { createCategory } from "@/tests/helpers/factories";

function civilDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateInCurrentMonth(day: number): string {
  const now = new Date();
  return civilDate(now.getFullYear(), now.getMonth() + 1, day);
}

function dateInPreviousMonth(day: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m === 1) {
    return civilDate(y - 1, 12, day);
  }
  return civilDate(y, m - 1, day);
}

async function createAccount(db: Awaited<ReturnType<typeof createTestDb>>["db"], userId: string, name: string) {
  const [acc] = await db
    .insert(accounts)
    .values({ userId, name, type: "checking", createdAt: new Date() })
    .returning();
  return acc;
}

describe("getCurrentSituation", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const sut = await createTestDb();
    db = sut.db;
    cleanupDb = sut.cleanup;

    userId = (await findOrCreateUser(db, "test@test.com", false)).id;
    const acc = await createAccount(db, userId, "Checking");
    accountId = acc.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("returns zero for all metrics when user has no transactions", async () => {
    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 0,
      monthIncomeCents: 0,
      monthExpenseCents: 0,
    });
  });

  it("total balance sums income and expense regardless of month", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 5000, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "expense", amountCents: -2000, date: dateInPreviousMonth(15) },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 3000,
      monthIncomeCents: 5000,
      monthExpenseCents: 0,
    });
  });

  it("month income sums only current-month income transactions", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 3000, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "expense", amountCents: -500, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "income", amountCents: 2000, date: dateInPreviousMonth(15) },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 4500,
      monthIncomeCents: 3000,
      monthExpenseCents: 500,
    });
  });

  it("month expenses sums only current-month expense transactions", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -1500, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "income", amountCents: 2000, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "expense", amountCents: -1000, date: dateInPreviousMonth(15) },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: -500,
      monthIncomeCents: 2000,
      monthExpenseCents: 1500,
    });
  });

  it("total balance includes transactions from all months", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 5000, date: dateInPreviousMonth(15) },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 5000,
      monthIncomeCents: 0,
      monthExpenseCents: 0,
    });
  });

  it("ignores another user's transactions entirely", async () => {
    const otherUserId = (await findOrCreateUser(db, "other@test.com", false)).id;
    const otherAccount = await createAccount(db, otherUserId, "Other Checking");

    await db.insert(transactions).values([
      { userId: otherUserId, accountId: otherAccount.id, type: "income", amountCents: 9999, date: dateInCurrentMonth(15) },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 0,
      monthIncomeCents: 0,
      monthExpenseCents: 0,
    });
  });

  it("transfer legs net to zero in total balance", async () => {
    const destAccount = await createAccount(db, userId, "Savings");
    const transferGroupId = crypto.randomUUID();

    await db.insert(transactions).values([
      { userId, accountId, type: "transfer", amountCents: -1000, date: dateInCurrentMonth(15), transferGroupId, counterpartyAccountId: destAccount.id },
      { userId, accountId: destAccount.id, type: "transfer", amountCents: 1000, date: dateInCurrentMonth(15), transferGroupId, counterpartyAccountId: accountId },
    ]);

    const result = await getCurrentSituation(db, userId);

    expect(result).toStrictEqual({
      totalBalanceCents: 0,
      monthIncomeCents: 0,
      monthExpenseCents: 0,
    });
  });
});

describe("getBalanceHistory", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const sut = await createTestDb();
    db = sut.db;
    cleanupDb = sut.cleanup;

    userId = (await findOrCreateUser(db, "test@test.com", false)).id;
    const acc = await createAccount(db, userId, "Checking");
    accountId = acc.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("initial balance includes transactions before the period", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 10000, date: dateInPreviousMonth(15) },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const firstDay = result[0];
    expect(firstDay.balanceCents).toBe(10000);
  });

  it("each bucket accumulates over the previous", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 5000, date: dateInCurrentMonth(10) },
      { userId, accountId, type: "expense", amountCents: -2000, date: dateInCurrentMonth(15) },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const day10 = result.find((r) => r.date === dateInCurrentMonth(10));
    const day15 = result.find((r) => r.date === dateInCurrentMonth(15));

    expect(day10?.balanceCents).toBe(5000);
    expect(day15?.balanceCents).toBe(3000);
  });

  it("empty bucket retains previous balance", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 5000, date: dateInCurrentMonth(10) },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const day10 = result.find((r) => r.date === dateInCurrentMonth(10));
    const day11 = result.find((r) => r.date === dateInCurrentMonth(11));

    expect(day10?.balanceCents).toBe(5000);
    expect(day11?.balanceCents).toBe(5000);
  });

  it("transfer does not alter total balance", async () => {
    const destAccount = await createAccount(db, userId, "Savings");
    const transferGroupId = crypto.randomUUID();

    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 10000, date: dateInCurrentMonth(5) },
      { userId, accountId, type: "transfer", amountCents: -3000, date: dateInCurrentMonth(10), transferGroupId, counterpartyAccountId: destAccount.id },
      { userId, accountId: destAccount.id, type: "transfer", amountCents: 3000, date: dateInCurrentMonth(10), transferGroupId, counterpartyAccountId: accountId },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const day5 = result.find((r) => r.date === dateInCurrentMonth(5));
    const day10 = result.find((r) => r.date === dateInCurrentMonth(10));

    expect(day5?.balanceCents).toBe(10000);
    expect(day10?.balanceCents).toBe(10000);
  });

  it("initial_balance counts in the balance", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "initial_balance", amountCents: 50000, date: dateInCurrentMonth(1) },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const day1 = result.find((r) => r.date === dateInCurrentMonth(1));
    expect(day1?.balanceCents).toBe(50000);
  });

  it("ignores another user's transactions", async () => {
    const otherUserId = (await findOrCreateUser(db, "other@test.com", false)).id;
    const otherAccount = await createAccount(db, otherUserId, "Other");

    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 5000, date: dateInCurrentMonth(10) },
      { userId: otherUserId, accountId: otherAccount.id, type: "income", amountCents: 9999, date: dateInCurrentMonth(10) },
    ]);

    const result = await getBalanceHistory(db, userId, "this-month");

    const day10 = result.find((r) => r.date === dateInCurrentMonth(10));
    expect(day10?.balanceCents).toBe(5000);
  });

  it("ytd starts from january 1st of current year", async () => {
    const now = new Date();
    const janDate = civilDate(now.getFullYear(), 1, 15);
    await db.insert(transactions).values([
      { userId, accountId, type: "income", amountCents: 10000, date: janDate },
    ]);

    const result = await getBalanceHistory(db, userId, "ytd");

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].date).toBe(civilDate(now.getFullYear(), 1, 1).slice(0, 7));
    const last = result[result.length - 1];
    expect(last.date).toBe(civilDate(now.getFullYear(), now.getMonth() + 1, 1).slice(0, 7));
  });

});

describe("getSpendingByCategory", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    const sut = await createTestDb();
    db = sut.db;
    cleanupDb = sut.cleanup;

    userId = (await findOrCreateUser(db, "test@test.com", false)).id;
    const acc = await createAccount(db, userId, "Checking");
    accountId = acc.id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("groups expenses by category with correct totals", async () => {
    const food = await createCategory(db, userId, { name: "Test Food", type: "expense" });
    const transport = await createCategory(db, userId, { name: "Test Transport", type: "expense" });

    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -5000, categoryId: food.id, date: dateInCurrentMonth(10) },
      { userId, accountId, type: "expense", amountCents: -2000, categoryId: food.id, date: dateInCurrentMonth(15) },
      { userId, accountId, type: "expense", amountCents: -1500, categoryId: transport.id, date: dateInCurrentMonth(20) },
    ]);

    const result = await getSpendingByCategory(db, userId, "this-month");

    expect(result).toHaveLength(2);
    expect(result[0].categoryName).toBe("Test Food");
    expect(result[0].totalCents).toBe(7000);
    expect(result[1].categoryName).toBe("Test Transport");
    expect(result[1].totalCents).toBe(1500);
  });

  it("shows Uncategorized for transactions without categoryId", async () => {
    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -3000, date: dateInCurrentMonth(10) },
    ]);

    const result = await getSpendingByCategory(db, userId, "this-month");

    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe("Uncategorized");
    expect(result[0].totalCents).toBe(3000);
  });

  it("excludes income, transfer, and initial_balance transactions", async () => {
    const food = await createCategory(db, userId, { name: "Test Food", type: "expense" });

    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -2000, categoryId: food.id, date: dateInCurrentMonth(10) },
      { userId, accountId, type: "income", amountCents: 5000, date: dateInCurrentMonth(10) },
    ]);

    const result = await getSpendingByCategory(db, userId, "this-month");

    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe("Test Food");
  });

  it("returns empty array when no expenses in period", async () => {
    const result = await getSpendingByCategory(db, userId, "this-month");
    expect(result).toHaveLength(0);
  });

  it("ignores another user's transactions", async () => {
    const food = await createCategory(db, userId, { name: "Test Food", type: "expense" });
    const otherUserId = (await findOrCreateUser(db, "other@test.com", false)).id;
    const otherAccount = await createAccount(db, otherUserId, "Other");

    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -2000, categoryId: food.id, date: dateInCurrentMonth(10) },
      { userId: otherUserId, accountId: otherAccount.id, type: "expense", amountCents: -9999, date: dateInCurrentMonth(10) },
    ]);

    const result = await getSpendingByCategory(db, userId, "this-month");

    expect(result).toHaveLength(1);
    expect(result[0].totalCents).toBe(2000);
  });

  it("sorts by totalCents descending", async () => {
    const catA = await createCategory(db, userId, { name: "Test Cat A", type: "expense" });
    const catB = await createCategory(db, userId, { name: "Test Cat B", type: "expense" });
    const catC = await createCategory(db, userId, { name: "Test Cat C", type: "expense" });

    await db.insert(transactions).values([
      { userId, accountId, type: "expense", amountCents: -500, categoryId: catC.id, date: dateInCurrentMonth(10) },
      { userId, accountId, type: "expense", amountCents: -3000, categoryId: catA.id, date: dateInCurrentMonth(10) },
      { userId, accountId, type: "expense", amountCents: -1000, categoryId: catB.id, date: dateInCurrentMonth(10) },
    ]);

    const result = await getSpendingByCategory(db, userId, "this-month");

    expect(result[0].categoryName).toBe("Test Cat A");
    expect(result[0].totalCents).toBe(3000);
    expect(result[1].categoryName).toBe("Test Cat B");
    expect(result[1].totalCents).toBe(1000);
    expect(result[2].categoryName).toBe("Test Cat C");
    expect(result[2].totalCents).toBe(500);
  });
});
