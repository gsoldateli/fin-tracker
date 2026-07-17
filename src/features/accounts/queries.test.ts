import { createAccount, transfer } from "./service";
import { beforeEach, describe, it } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { findOrCreateUser } from "../auth/service";
import { getAccountDeletionInfo, listAccountsWithBalance } from "./queries";
import { transactions } from "@/src/db/schema";
import { getTodayCivilDate } from "@/src/lib/date";

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
            date: getTodayCivilDate(),
            description: "Test income",
        })
        await db.insert(transactions).values({
            userId,
            accountId: account.id,
            type: "expense",
            amountCents: -200,
            date: getTodayCivilDate(),
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

    describe("getAccountDeletionInfo", () => {
        it("returns (0, false) for an empty account", async () => {
            const accountRes = await createAccount(db, userId, { name: "Empty", type: "checking", initialBalanceCents: 0 });
            if (!accountRes.ok) throw new Error("Failed to create account");

            const info = await getAccountDeletionInfo(db, userId, accountRes.value.id);
            expect(info).toEqual({ transactionCount: 0, hasTransfers: false });
        });

        it("counts income and expense transactions", async () => {
            const accountRes = await createAccount(db, userId, { name: "With Txs", type: "checking", initialBalanceCents: 0 });
            if (!accountRes.ok) throw new Error("Failed to create account");
            const account = accountRes.value;

            await db.insert(transactions).values([
                { userId, accountId: account.id, type: "income", amountCents: 500, date: getTodayCivilDate(), description: "i1" },
                { userId, accountId: account.id, type: "expense", amountCents: -200, date: getTodayCivilDate(), description: "e1" },
                { userId, accountId: account.id, type: "income", amountCents: 300, date: getTodayCivilDate(), description: "i2" },
            ]);

            const info = await getAccountDeletionInfo(db, userId, account.id);
            expect(info).toEqual({ transactionCount: 3, hasTransfers: false });
        });

        it("counts initial_balance as a regular transaction", async () => {
            const accountRes = await createAccount(db, userId, { name: "With IB", type: "checking", initialBalanceCents: 5000 });
            if (!accountRes.ok) throw new Error("Failed to create account");

            const info = await getAccountDeletionInfo(db, userId, accountRes.value.id);
            expect(info).toEqual({ transactionCount: 1, hasTransfers: false });
        });

        it("returns hasTransfers=true for the source account of a transfer", async () => {
            const source = await createAccount(db, userId, { name: "Source", type: "checking", initialBalanceCents: 100000 });
            const dest = await createAccount(db, userId, { name: "Dest", type: "checking" });
            if (!source.ok || !dest.ok) throw new Error("Failed to create accounts");

            await transfer(db, userId, { fromId: source.value.id, toId: dest.value.id, amountCents: 1000, description: "t", date: getTodayCivilDate() });

            const info = await getAccountDeletionInfo(db, userId, source.value.id);
            expect(info.hasTransfers).toBe(true);
        });

        it("returns hasTransfers=true for the destination account of a transfer", async () => {
            const source = await createAccount(db, userId, { name: "Source2", type: "checking", initialBalanceCents: 100000 });
            const dest = await createAccount(db, userId, { name: "Dest2", type: "checking" });
            if (!source.ok || !dest.ok) throw new Error("Failed to create accounts");

            await transfer(db, userId, { fromId: source.value.id, toId: dest.value.id, amountCents: 1000, description: "t", date: getTodayCivilDate() });

            const info = await getAccountDeletionInfo(db, userId, dest.value.id);
            expect(info.hasTransfers).toBe(true);
        });

        it("filters by userId — other user's data is invisible", async () => {
            const otherUser = await findOrCreateUser(db, "other@test.com");
            const accountRes = await createAccount(db, otherUser.id, { name: "Other", type: "checking", initialBalanceCents: 5000 });
            if (!accountRes.ok) throw new Error("Failed to create account");

            const info = await getAccountDeletionInfo(db, userId, accountRes.value.id);
            expect(info).toEqual({ transactionCount: 0, hasTransfers: false });
        });
    });
})