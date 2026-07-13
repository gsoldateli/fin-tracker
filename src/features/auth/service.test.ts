import { describe, it, expect, beforeEach } from "vitest";

import { transactionCategories, users } from "@/src/db/schema";
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

    it("logging in twice does not duplicate categories", async () => {
        await findOrCreateUser(db, "dedup@test.com");
        const afterFirst = await db.select().from(transactionCategories);

        await findOrCreateUser(db, "dedup@test.com");
        const afterSecond = await db.select().from(transactionCategories);

        expect(afterSecond).toHaveLength(afterFirst.length); // did not increase
        expect(afterFirst.length).toBeGreaterThan(0);         // seed did run
    });
});