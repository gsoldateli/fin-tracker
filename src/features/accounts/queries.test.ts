import { createAccount } from "./service";
import { beforeEach, describe, it } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { create } from "domain";
import { findOrCreateUser } from "../auth/service";
import { listAccountsWithBalance } from "./queries";
import { transactions } from "@/src/db/schema";

describe('query', () => {
    let db: Awaited<ReturnType<typeof createTestDb>>['db'];
    let cleanupDb: Awaited<ReturnType<typeof createTestDb>>['cleanup'];
    let userId: string;

    beforeEach(async () => {
        const dbSut = await createTestDb();

        db = dbSut.db;
        cleanupDb = dbSut.cleanup;
        const user = await findOrCreateUser(db, "test@test.com");
        userId = user.id;
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("returns the sum of income and expense as the account balance", async () => {
        const accountRes = await createAccount(db, userId, { name: "Test Account", type: "checking", initialBalanceCents: 1000 });
        if (!accountRes.ok) {
            throw new Error("Failed to create account");
        }
        const account = accountRes.value;
        await db.insert(transactions).values({
            userId,
            accountId: account.id,
            type: "income",
            amountCents: 500,
            date: new Date(),
            description: "Test income",
        })
        await db.insert(transactions).values({
            userId,
            accountId: account.id,
            type: "expense",
            amountCents: -200,
            date: new Date(),
            description: "Test expense",
        })
        const [accountWithBalance] = await listAccountsWithBalance(db, userId, [account.id]);
        expect(accountWithBalance.balanceCents).toBe(1300);
    });

    it("returns zero balance for an account with no transactions", async () => {
        const accountRes = await createAccount(db, userId, { name: "Test Account", type: "checking", initialBalanceCents: 0 });
        if (!accountRes.ok) {
            throw new Error("Failed to create account");
        }
        const account = accountRes.value;

        const [accountWithBalance] = await listAccountsWithBalance(db, userId, [account.id]);
        expect(accountWithBalance.balanceCents).toBe(0);
    });
})