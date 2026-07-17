import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/tests/helpers/db";
import { accounts, transactionCategories, transactions } from "@/src/db/schema";
import { findOrCreateUser } from "@/src/features/auth/service";
import { createCategory, deleteCategory } from "./service";
import { getTodayCivilDate } from "@/src/lib/date";
import { listCategories } from "./queries";

describe("categories service", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>["db"];
  let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
  let userId: string;

  beforeEach(async () => {
    const { db: testDb, cleanup } = await createTestDb();
    db = testDb;
    cleanupDb = cleanup;
    userId = (await findOrCreateUser(db, "test@test.com")).id;
  });

  afterEach(async () => {
    await cleanupDb();
  });

  describe("createCategory", () => {
    it("creates a new category linked to the user", async () => {
      const result = await createCategory(db, userId, {
        name: "Groceries",
        type: "expense",
      });

      expect(result).toMatchObject({
        ok: true,
        created: true,
      });
      if (!result.ok) return;
      expect(result.value.name).toBe("Groceries");
      expect(result.value.type).toBe("expense");
      expect(result.value.userId).toBe(userId);
      expect(result.value.id).toBeDefined();
    });

    it("does not duplicate: reuses existing category with same name and type", async () => {
      const first = await createCategory(db, userId, {
        name: "Groceries",
        type: "expense",
      });
      expect(first.ok).toBe(true);
      if (!first.ok) return;

      const second = await createCategory(db, userId, {
        name: "Groceries",
        type: "expense",
      });

      expect(second).toMatchObject({ ok: true, created: false });
      if (!second.ok) return;
      expect(second.value.id).toBe(first.value.id);
    });

    it("dedup is case-insensitive: 'Pet' and 'pet' are the same", async () => {
      const first = await createCategory(db, userId, {
        name: "Pet",
        type: "expense",
      });
      expect(first.ok).toBe(true);
      if (!first.ok) return;

      const second = await createCategory(db, userId, {
        name: "pet",
        type: "expense",
      });

      expect(second).toMatchObject({ ok: true, created: false });
      if (!second.ok) return;
      expect(second.value.id).toBe(first.value.id);

      const third = await createCategory(db, userId, {
        name: "PET",
        type: "expense",
      });

      expect(third).toMatchObject({ ok: true, created: false });
      if (!third.ok) return;
      expect(third.value.id).toBe(first.value.id);
    });

    it("same name with different types creates two categories", async () => {
      const expense = await createCategory(db, userId, {
        name: "Misc",
        type: "expense",
      });
      expect(expense.ok).toBe(true);
      if (!expense.ok) return;
      expect(expense.created).toBe(true);

      const income = await createCategory(db, userId, {
        name: "Misc",
        type: "income",
      });

      expect(income.ok).toBe(true);
      if (!income.ok) return;
      expect(income.created).toBe(true);
      expect(income.value.id).not.toBe(expense.value.id);
    });

    it("rejects empty / whitespace-only name", async () => {
      const empty = await createCategory(db, userId, {
        name: "",
        type: "expense",
      });
      expect(empty).toMatchObject({ ok: false, error: "INVALID_NAME" });

      const whitespace = await createCategory(db, userId, {
        name: "   ",
        type: "income",
      });
      expect(whitespace).toMatchObject({ ok: false, error: "INVALID_NAME" });
    });

    it("two users can have a category with the same name", async () => {
      const user2 = (await findOrCreateUser(db, "other@test.com")).id;

      const a = await createCategory(db, userId, {
        name: "CustomFood",
        type: "expense",
      });
      expect(a.ok).toBe(true);
      if (!a.ok) return;
      expect(a.created).toBe(true);

      const b = await createCategory(db, user2, {
        name: "CustomFood",
        type: "expense",
      });

      expect(b.ok).toBe(true);
      if (!b.ok) return;
      expect(b.created).toBe(true);
      expect(b.value.id).not.toBe(a.value.id);
      expect(b.value.userId).toBe(user2);
    });
  });

  describe("deleteCategory", () => {
    // let db: Awaited<ReturnType<typeof createTestDb>>["db"];
    // let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
    // let userId: string;

    // beforeEach(async () => {
    //   const { db: testDb, cleanup } = await createTestDb();
    //   db = testDb;
    //   cleanupDb = cleanup;
    //   userId = (await findOrCreateUser(db, "test@test.com")).id;
    // });

    // afterEach(async () => {
    //   await cleanupDb();
    // });

    it("deletes category without transactions", async () => {
      const created = await createCategory(db, userId, {
        name: "ToDelete",
        type: "expense",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await deleteCategory(db, userId, created.value.id);
      expect(result).toMatchObject({ ok: true });

      const [found] = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, created.value.id));
      expect(found).toBeUndefined();
    });

    it("does not delete another user's category", async () => {
      const user2 = (await findOrCreateUser(db, "other@test.com")).id;

      const created = await createCategory(db, user2, {
        name: "Their Category",
        type: "expense",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await deleteCategory(db, userId, created.value.id);
      expect(result).toMatchObject({ ok: false, error: "CATEGORY_NOT_FOUND" });

      const [stillExists] = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, created.value.id));
      expect(stillExists).toBeDefined();
    });

    it("blocks deletion of category in use", async () => {
      const created = await createCategory(db, userId, {
        name: "In Use",
        type: "expense",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const [account] = await db
        .insert(accounts)
        .values({
          userId,
          name: "Checking",
          type: "checking",
          createdAt: new Date(),
        })
        .returning();

      await db.insert(transactions).values({
        userId,
        accountId: account.id,
        categoryId: created.value.id,
        type: "expense",
        amountCents: -1000,
        date: getTodayCivilDate(),
      });

      const result = await deleteCategory(db, userId, created.value.id);
      expect(result).toMatchObject({ ok: false, error: "CATEGORY_IN_USE" });

      const [stillExists] = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, created.value.id));
      expect(stillExists).toBeDefined();
    });
  });

  describe("listCategories", () => {
    let db: Awaited<ReturnType<typeof createTestDb>>["db"];
    let cleanupDb: Awaited<ReturnType<typeof createTestDb>>["cleanup"];
    let userId: string;

    beforeEach(async () => {
      const { db: testDb, cleanup } = await createTestDb();
      db = testDb;
      cleanupDb = cleanup;
      userId = (await findOrCreateUser(db, "test@test.com")).id;
    });

    afterEach(async () => {
      await cleanupDb();
    });

    it("lists only the user's categories", async () => {
      const user2 = (await findOrCreateUser(db, "other@test.com")).id;

      await createCategory(db, userId, { name: "Mine", type: "expense" });
      await createCategory(db, user2, { name: "Theirs", type: "expense" });

      const list = await listCategories(db, userId);
      const names = list.map((c) => c.name);
      expect(names).toContain("Mine");
      expect(names).not.toContain("Theirs");
    });

    it("filters by type when provided", async () => {
      await createCategory(db, userId, { name: "CustomExp", type: "expense" });
      await createCategory(db, userId, { name: "CustomInc", type: "income" });

      const expenses = await listCategories(db, userId, "expense");
      const expenseNames = expenses.map((c) => c.name);
      expect(expenseNames).toContain("CustomExp");
      expect(expenseNames).not.toContain("CustomInc");

      const incomes = await listCategories(db, userId, "income");
      const incomeNames = incomes.map((c) => c.name);
      expect(incomeNames).toContain("CustomInc");
      expect(incomeNames).not.toContain("CustomExp");
    });

    it("orders by name", async () => {
      await createCategory(db, userId, { name: "Zoo", type: "expense" });
      await createCategory(db, userId, { name: "Alpha", type: "expense" });
      await createCategory(db, userId, { name: "Beta", type: "expense" });

      const list = await listCategories(db, userId, "expense");
      const names = list.map((c) => c.name);
      expect(names.indexOf("Alpha")).toBeLessThan(names.indexOf("Beta"));
      expect(names.indexOf("Beta")).toBeLessThan(names.indexOf("Zoo"));
    });
  });
})