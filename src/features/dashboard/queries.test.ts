import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { getCurrentSituation } from "./queries";

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
