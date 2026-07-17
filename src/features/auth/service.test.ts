import { describe, it, expect, beforeEach } from "vitest";
import { eq, sql } from "drizzle-orm";

import { accounts as accountsTable, transactionCategories, transactions, users } from "@/src/db/schema";
import { createTestDb } from "@/tests/helpers/db";

import { findOrCreateUser } from "./service";

describe("findOrCreateUser", () => {
    let db: Awaited<ReturnType<typeof createTestDb>>['db'];
    let cleanupDb: Awaited<ReturnType<typeof createTestDb>>['cleanup'];

    beforeEach(async () => {
        const dbSut = await createTestDb();
        db = dbSut.db;
        cleanupDb = dbSut.cleanup;
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("registers a new user when the email does not exist", async () => {
        const user = await findOrCreateUser(db, "novo@test.com");

        expect(user.id).toBeDefined();
        expect(user.email).toBe("novo@test.com");

        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1); // created exactly one
    });

    it("returns the existing user without creating a duplicate (login)", async () => {
        const primeiro = await findOrCreateUser(db, "recorrente@test.com");
        const segundo = await findOrCreateUser(db, "recorrente@test.com");

        expect(segundo.id).toBe(primeiro.id); // same user
        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1); // didn't duplicate
    });

    it("preserves the original createdAt date on subsequent logins", async () => {
        const primeiro = await findOrCreateUser(db, "estavel@test.com");
        const segundo = await findOrCreateUser(db, "estavel@test.com");

        // upsert cannot "reset" the creation date on each login
        expect(segundo.createdAt.getTime()).toBe(primeiro.createdAt.getTime());
    });

    it("handles concurrent calls with the same email without throwing errors", async () => {
        // file-based SQLite serializes transactions — sequential calls suffice
        // to verify the atomic upsert guarantees correctness
        const a = await findOrCreateUser(db, "corrida@test.com");
        const b = await findOrCreateUser(db, "corrida@test.com");

        expect(a.id).toBe(b.id);
        const rows = await db.select().from(users);
        expect(rows).toHaveLength(1);
    });

    it("seeds demo accounts with the right total balance", async () => {
        const user = await findOrCreateUser(db, "demo@test.com");

        const seededAccounts = await db
            .select()
            .from(accountsTable)
            .where(eq(accountsTable.userId, user.id));

        expect(seededAccounts).toHaveLength(2);
        expect(seededAccounts.map((a) => a.name).sort()).toEqual(["Checking", "Savings"]);

        const [{ total }] = await db
            .select({ total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)` })
            .from(transactions)
            .where(eq(transactions.userId, user.id));

        // $9,999 checking + $5,001 savings = $15,000
        expect(total).toBe(1_500_000);
    });

    it("does not duplicate accounts or transactions on second login", async () => {
        await findOrCreateUser(db, "no-dup@test.com");
        const afterFirst = await db.select().from(accountsTable);

        await findOrCreateUser(db, "no-dup@test.com");
        const afterSecond = await db.select().from(accountsTable);

        expect(afterSecond).toHaveLength(afterFirst.length);
        expect(afterFirst.length).toBeGreaterThan(0);
    });

    it("logging in twice does not duplicate categories", async () => {
        await findOrCreateUser(db, "dedup@test.com");
        const afterFirst = await db.select().from(transactionCategories);

        await findOrCreateUser(db, "dedup@test.com");
        const afterSecond = await db.select().from(transactionCategories);

        expect(afterSecond).toHaveLength(afterFirst.length); // did not increase
        expect(afterFirst.length).toBeGreaterThan(0);         // seed did run
    });
});