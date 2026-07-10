import { describe, it } from "vitest";
import { createTestDb } from "@/tests/helpers/db";
import { createAccount, deleteAccount, transfer, updateAccount } from "./service";
import { transactions } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { findOrCreateUser } from "../auth/service";
import { listAccountsWithBalance } from "./queries";


describe("accounts service", () => {
    let db: Awaited<ReturnType<typeof createTestDb>>['db'];
    let cleanupDb: Awaited<ReturnType<typeof createTestDb>>['cleanup'];
    let userId: string;



    beforeEach(async () => {
        const dbAndCleanup = await createTestDb();
        db = dbAndCleanup.db;
        cleanupDb = dbAndCleanup.cleanup;
        userId = (await findOrCreateUser(db, "test@test.com")).id;

    });
    afterEach(async () => {
        await cleanupDb();
    });

    describe('createAccount', () => {
        it("must create only a new account with no initial transactions if initial balance is zero", async () => {

            const account = await createAccount(db, userId, {
                name: "Test account",
                initialBalanceCents: 0,
                type: "savings",
            });

            expect(account.ok).toBe(true);

            if (account.ok) {
                expect(account?.value?.id).toBeDefined();
                expect(account?.value?.name).toBe("Test account");
                const txs = await db
                    .select()
                    .from(transactions)
                    .where(eq(transactions.accountId, account.value.id));
                expect(txs).toHaveLength(0);
            }


        });
        it("must create a new account and transaction if initial balance is provided", async () => {

            const accountRes = await createAccount(db, userId, {
                name: "Test account",
                initialBalanceCents: 990,
                type: "savings",
            });

            expect(accountRes.ok).toBe(true);
            if (accountRes.ok) {
                expect(accountRes?.value?.id).toBeDefined();
                expect(accountRes?.value?.name).toBe("Test account");

                const txs = await db
                    .select()
                    .from(transactions)
                    .where(eq(transactions.accountId, accountRes.value.id));

                expect(txs).toHaveLength(1);
                expect(txs[0].type).toBe("initial_balance");
                expect(txs[0].amountCents).toBe(990);
                expect(txs[0].userId).toBe(userId);
            }

        });

        it("must throw an error if name is already taken", async () => {
            const firstAccount = await createAccount(db, userId, {
                name: "Test account",
                // initialBalanceCents: 990,
                type: "savings",
            });

            expect(firstAccount.ok).toBe(true);
            const secondAccount = await createAccount(db, userId, {
                name: "Test account",
                // initialBalanceCents: 990,
                type: "savings",
            });

            expect(secondAccount).toStrictEqual({
                ok: false,
                error: "ACCOUNT_NAME_ALREADY_EXISTS"
            });

        });

        it("must throw an error if initial balance is not an integer", async () => {
            const account = await createAccount(db, userId, {
                name: "Test account",
                initialBalanceCents: 12.3,
                type: "savings",
            });
            expect(account).toStrictEqual({
                ok: false,
                error: "INVALID_INITIAL_BALANCE"
            });
        });
    })

    describe('deleteAccount', () => {
        it('only allows deletion of owned account', async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test account",
                type: "savings",
            });


            expect(accountRes.ok).toBe(true);
            if (accountRes.ok) {

                const account = accountRes.value;

                const hackerDeleteAccountRes = await deleteAccount(db, 'hacker-user-id', account.id);
                expect(hackerDeleteAccountRes).toStrictEqual({
                    ok: false,
                    error: "ACCOUNT_NOT_FOUND"
                });

                const deleteRes = await deleteAccount(db, userId, account.id);
                expect(deleteRes.ok).toBe(true);
            }
        })
        it("deletes the account and cascades its income/expense transactions", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test account",
                type: "savings",
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) {
                throw new Error("Failed to create account");
            }


            await db.insert(transactions).values({
                userId,
                accountId: accountRes.value.id,
                type: "income",
                amountCents: 1000,
                date: new Date(),
                description: "Test transaction",
            })

            await db.insert(transactions).values({
                userId,
                accountId: accountRes.value.id,
                type: "expense",
                amountCents: -500,
                date: new Date(),
                description: "Test transaction",
            })

            const deleteRes = await deleteAccount(db, userId, accountRes.value.id);
            expect(deleteRes.ok).toBe(true);
            const txs = await db.select().from(transactions).where(eq(transactions.accountId, accountRes.value.id));
            expect(txs).toHaveLength(0);
        })
        it("refuses to delete an account that was the source of a transfer", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source Account",
                type: "savings",
                initialBalanceCents: 100000
            });
            const destinationAccount = await createAccount(db, userId, {
                name: "Destination Account",
                type: "savings",
            });
            expect(sourceAccount.ok).toBe(true);
            expect(destinationAccount.ok).toBe(true);
            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }

            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 1000,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferRes.ok).toBe(true);
            if (!transferRes.ok) {
                throw new Error("Failed to create transfer");
            }

            const deleteRes = await deleteAccount(db, userId, sourceAccount.value.id);
            expect(deleteRes).toStrictEqual({
                ok: false,
                error: "ACCOUNT_HAS_TRANSFER_TRANSACTIONS"
            });
        })
        it("refuses to delete an account that was the destination of a transfer", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source Account",
                type: "savings",
                initialBalanceCents: 100000
            });
            const destinationAccount = await createAccount(db, userId, {
                name: "Destination Account",
                type: "savings",
            });
            expect(sourceAccount.ok).toBe(true);
            expect(destinationAccount.ok).toBe(true);
            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }

            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 1000,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferRes.ok).toBe(true);
            if (!transferRes.ok) {
                throw new Error("Failed to create transfer");
            }

            const deleteRes = await deleteAccount(db, userId, destinationAccount.value.id);
            expect(deleteRes).toStrictEqual({
                ok: false,
                error: "ACCOUNT_HAS_TRANSFER_TRANSACTIONS"
            });
        });
    }
    )

    describe('tranfer', () => {

        it("debits the source and credits the destination by the same amount", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source account",
                type: "checking",
                initialBalanceCents: 30_000
            });
            const destinationAccount = await createAccount(db, userId, {
                name: "Destination account",
                type: "savings",
            });
            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }
            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 1000,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferRes.ok).toBe(true);

            if (transferRes.ok) {
                const { transferGroupId } = transferRes.value
                expect(transferGroupId).toBeDefined()

                // check transactions
                const sourceAccountTransaction = await db.select().from(transactions).where(and(eq(transactions.transferGroupId, transferRes.value.transferGroupId), eq(transactions.userId, userId), eq(transactions.accountId, sourceAccount.value.id)));
                const destinationAccountTransaction = await db.select().from(transactions).where(and(eq(transactions.transferGroupId, transferRes.value.transferGroupId), eq(transactions.userId, userId), eq(transactions.accountId, destinationAccount.value.id)));
                expect(sourceAccountTransaction).toHaveLength(1);
                expect(destinationAccountTransaction).toHaveLength(1);

                expect(sourceAccountTransaction[0].counterpartyAccountId).toBe(destinationAccount.value.id);
                expect(destinationAccountTransaction[0].counterpartyAccountId).toBe(sourceAccount.value.id);

                expect(sourceAccountTransaction[0].userId).toBe(userId);
                expect(destinationAccountTransaction[0].userId).toBe(userId);

                expect(sourceAccountTransaction[0].transferGroupId).toBe(transferRes.value.transferGroupId);
                expect(destinationAccountTransaction[0].transferGroupId).toBe(transferRes.value.transferGroupId);

                expect(sourceAccountTransaction[0].description).toBe("Transfer");
                expect(destinationAccountTransaction[0].description).toBe("Transfer");

                expect(sourceAccountTransaction[0].type).toBe("transfer");
                expect(destinationAccountTransaction[0].type).toBe("transfer");
            }


        })

        it("rejects insufficient funds without changing any balance", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source account",
                type: "checking",
                initialBalanceCents: 1000
            });

            const destinationAccount = await createAccount(db, userId, {
                name: "Destination account",
                type: "savings",
            });

            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }

            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 3000,
                description: "Transfer",
                date: new Date(),
            });

            const [sourceAccountWithBalance] = await listAccountsWithBalance(db, userId, [sourceAccount.value.id])
            expect(sourceAccountWithBalance.balanceCents).toBe(1000);

            const [destinationAccountWithBalance] = await listAccountsWithBalance(db, userId, [destinationAccount.value.id])
            expect(destinationAccountWithBalance.balanceCents).toBe(0);


            expect(transferRes.ok).toBe(false);
            expect(transferRes.error).toBe("INSUFFICIENT_FUNDS");

        })
        it("rejects transferring to another user's account", async () => {

            const sourceAccount = await createAccount(db, userId, {
                name: "Source account",
                type: "checking",
                initialBalanceCents: 1000
            });

            const otherUser = await findOrCreateUser(db, 'other@usercom')
            const destinationAccount = await createAccount(db, otherUser.id, {
                name: "Destination account",
                type: "savings",
            });

            expect(sourceAccount.ok).toBe(true);
            expect(destinationAccount.ok).toBe(true);
            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }

            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 3000,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferRes.ok).toBe(false);
            expect(transferRes.error).toBe("ACCOUNT_NOT_FOUND");

        })

        it("rejects transferring to the same account", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source account",
                type: "checking",
                initialBalanceCents: 1000
            });

            expect(sourceAccount.ok).toBe(true);

            if (!sourceAccount.ok) {
                throw new Error("Failed to create account");
            }

            const transferRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: sourceAccount.value.id,
                amountCents: 3000,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferRes.ok).toBe(false);
            expect(transferRes.error).toBe("SAME_ACCOUNT");
        })

        it("rejects zero or negative amounts", async () => {
            const sourceAccount = await createAccount(db, userId, {
                name: "Source account",
                type: "checking",
                initialBalanceCents: 1000
            });
            expect(sourceAccount.ok).toBe(true);


            const destinationAccount = await createAccount(db, userId, {
                name: "Destination account",
                type: "checking",
                initialBalanceCents: 5
            });
            expect(destinationAccount.ok).toBe(true);


            if (!sourceAccount.ok || !destinationAccount.ok) {
                throw new Error("Failed to create accounts");
            }

            const transferNegativeRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: -100,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferNegativeRes.ok).toBe(false);
            expect(transferNegativeRes.error).toBe("INVALID_AMOUNT");

            const transferZeroRes = await transfer(db, userId, {
                fromId: sourceAccount.value.id,
                toId: destinationAccount.value.id,
                amountCents: 0,
                description: "Transfer",
                date: new Date(),
            });

            expect(transferZeroRes.ok).toBe(false);
            expect(transferZeroRes.error).toBe("INVALID_AMOUNT");
        })
    })

    describe("updateAccount", () => {
        it("updates name and type", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Old name",
                type: "checking",
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, accountRes.value.id, {
                name: "New name",
                type: "savings",
                initialBalanceCents: 0,
            });

            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.value.name).toBe("New name");
                expect(result.value.type).toBe("savings");
            }
        });

        it("upserts initial_balance transaction when balance changes", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 5000,
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, accountRes.value.id, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 10000,
            });

            expect(result.ok).toBe(true);
            const [tx] = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.accountId, accountRes.value.id),
                        eq(transactions.type, "initial_balance"),
                    ),
                );
            expect(tx.amountCents).toBe(10000);
        });

        it("deletes initial_balance transaction when balance is cleared to 0", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 5000,
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, accountRes.value.id, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 0,
            });

            expect(result.ok).toBe(true);
            const txs = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.accountId, accountRes.value.id),
                        eq(transactions.type, "initial_balance"),
                    ),
                );
            expect(txs).toHaveLength(0);
        });

        it("inserts initial_balance transaction when setting balance for the first time", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 0,
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, accountRes.value.id, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 7500,
            });

            expect(result.ok).toBe(true);
            const [tx] = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.accountId, accountRes.value.id),
                        eq(transactions.type, "initial_balance"),
                    ),
                );
            expect(tx.amountCents).toBe(7500);
        });

        it("rejects duplicate name among user's other accounts", async () => {
            await createAccount(db, userId, {
                name: "Existing account",
                type: "savings",
            });
            const targetRes = await createAccount(db, userId, {
                name: "Target",
                type: "checking",
            });
            expect(targetRes.ok).toBe(true);
            if (!targetRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, targetRes.value.id, {
                name: "Existing account",
                type: "checking",
                initialBalanceCents: 0,
            });

            expect(result).toStrictEqual({
                ok: false,
                error: "ACCOUNT_NAME_ALREADY_EXISTS",
            });
        });

        it("returns ACCOUNT_NOT_FOUND for wrong userId", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "Test",
                type: "checking",
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, "other-user-id", accountRes.value.id, {
                name: "Test",
                type: "checking",
                initialBalanceCents: 0,
            });

            expect(result).toStrictEqual({
                ok: false,
                error: "ACCOUNT_NOT_FOUND",
            });
        });

        it("allows keeping the same name when other fields change", async () => {
            const accountRes = await createAccount(db, userId, {
                name: "My Account",
                type: "checking",
            });
            expect(accountRes.ok).toBe(true);
            if (!accountRes.ok) throw new Error("Failed to create account");

            const result = await updateAccount(db, userId, accountRes.value.id, {
                name: "My Account",
                type: "savings",
                initialBalanceCents: 0,
            });

            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.value.type).toBe("savings");
            }
        });
    });
});