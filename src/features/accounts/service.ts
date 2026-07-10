import { eq, and, sql, inArray } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { accounts, transactions } from "@/src/db/schema";
import type { CreateAccountInput, TransferInput, UpdateAccountInput } from "./schemas";
import { randomUUID } from "node:crypto";

export async function createAccount(
    db: Database,
    userId: string,
    input: CreateAccountInput,
) {
    const initialBalanceCents = input.initialBalanceCents ?? 0;
    if (!Number.isInteger(initialBalanceCents)) {
        return { ok: false as const, error: "INVALID_INITIAL_BALANCE" as const };
    }
    return db.transaction(async (tx) => {
        const userAlreadyHasAccountWithName = await tx.select().from(accounts).where(and(eq(accounts.name, input.name), eq(accounts.userId, userId))).limit(1);

        if (userAlreadyHasAccountWithName.length > 0) {
            return { ok: false as const, error: "ACCOUNT_NAME_ALREADY_EXISTS" as const };
        }



        const [account] = await tx
            .insert(accounts)
            .values({ name: input.name, type: input.type, userId, createdAt: new Date() })
            .returning();

        if (initialBalanceCents !== 0) {
            await tx.insert(transactions).values({
                type: "initial_balance",
                amountCents: initialBalanceCents,
                accountId: account.id,
                userId,
                description: "Saldo inicial",
                date: new Date(),
            });
        }

        return { ok: true as const, value: account };
    });
}

export async function updateAccount(
    db: Database,
    userId: string,
    accountId: string,
    input: UpdateAccountInput,
) {
    const initialBalanceCents = input.initialBalanceCents ?? 0;
    if (!Number.isInteger(initialBalanceCents)) {
        return { ok: false as const, error: "INVALID_INITIAL_BALANCE" as const };
    }

    return db.transaction(async (tx) => {
        const [account] = await tx
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

        if (!account) {
            return { ok: false as const, error: "ACCOUNT_NOT_FOUND" as const };
        }

        if (input.name !== account.name) {
            const [duplicate] = await tx
                .select()
                .from(accounts)
                .where(
                    and(
                        eq(accounts.name, input.name),
                        eq(accounts.userId, userId),
                        sql`${accounts.id} != ${accountId}`,
                    ),
                )
                .limit(1);

            if (duplicate) {
                return { ok: false as const, error: "ACCOUNT_NAME_ALREADY_EXISTS" as const };
            }
        }

        const [updated] = await tx
            .update(accounts)
            .set({ name: input.name, type: input.type })
            .where(eq(accounts.id, accountId))
            .returning();

        const [existingInitialBalance] = await tx
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.accountId, accountId),
                    eq(transactions.type, "initial_balance"),
                ),
            )
            .limit(1);

        if (initialBalanceCents === 0) {
            if (existingInitialBalance) {
                await tx
                    .delete(transactions)
                    .where(eq(transactions.id, existingInitialBalance.id));
            }
        } else {
            if (existingInitialBalance) {
                await tx
                    .update(transactions)
                    .set({ amountCents: initialBalanceCents })
                    .where(eq(transactions.id, existingInitialBalance.id));
            } else {
                await tx.insert(transactions).values({
                    type: "initial_balance",
                    amountCents: initialBalanceCents,
                    accountId,
                    userId,
                    description: "Saldo inicial",
                    date: new Date(),
                });
            }
        }

        return { ok: true as const, value: updated };
    });
}

export async function deleteAccount(db: Database, userId: string, accountId: string) {
    return db.transaction(async (tx) => {
        const hasTransferTransactions = await tx.select().from(transactions).where(and(eq(transactions.accountId, accountId), eq(transactions.type, "transfer"))).limit(1)

        if (hasTransferTransactions.length > 0) {
            return { ok: false as const, error: "ACCOUNT_HAS_TRANSFER_TRANSACTIONS" as const };
        }

        await tx
            .delete(transactions)
            .where(eq(transactions.accountId, accountId));

        const [deleted] = await tx
            .delete(accounts)
            .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
            .returning();


        if (!deleted) {
            return { ok: false as const, error: "ACCOUNT_NOT_FOUND" as const };
        }
        return { ok: true as const, value: deleted };
    })



}



export async function transfer(db: Database, userId: string, input: TransferInput) {
    const { fromId, toId, amountCents } = input;

    if (amountCents <= 0 || !Number.isInteger(amountCents)) {
        return { ok: false as const, error: "INVALID_AMOUNT" as const };
    }

    if (fromId === toId) {
        return { ok: false as const, error: "SAME_ACCOUNT" as const };
    }

    return db.transaction(async (tx) => {
        // ambas as contas devem existir E pertencer ao usuário.
        // buscar as duas de uma vez, filtrando por userId, resolve
        // existência + autorização numa query só.
        const owned = await tx
            .select({ id: accounts.id })
            .from(accounts)
            .where(and(eq(accounts.userId, userId), inArray(accounts.id, [fromId, toId])));

        if (owned.length !== 2) {
            // não distingue "não existe" de "é de outro usuário" — não vaza existência
            return { ok: false as const, error: "ACCOUNT_NOT_FOUND" as const };
        }

        const [{ balance }] = await tx
            .select({ balance: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)` })
            .from(transactions)
            .where(eq(transactions.accountId, fromId));

        if (balance < amountCents) {
            return { ok: false as const, error: "INSUFFICIENT_FUNDS" as const };
        }

        const transferGroupId = randomUUID();
        const now = new Date();

        await tx.insert(transactions).values([
            {
                type: "transfer",
                amountCents: -amountCents,          // débito
                accountId: fromId,
                counterpartyAccountId: toId,
                transferGroupId,
                userId,
                description: input.description ?? "Transferência",
                date: now,
                createdAt: now,
            },
            {
                type: "transfer",
                amountCents: amountCents,           // crédito
                accountId: toId,
                counterpartyAccountId: fromId,
                transferGroupId,
                userId,
                description: input.description ?? "Transferência",
                date: now,
                createdAt: now,
            },
        ]);

        return { ok: true as const, value: { transferGroupId } };
    });
}