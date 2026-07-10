import { eq, sql, desc, and, inArray } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { accounts, transactions } from "@/src/db/schema";

export async function listAccountsWithBalance(
    db: Database,
    userId: string,
    accountIds?: string[],
) {
    return db
        .select({
            id: accounts.id,
            name: accounts.name,
            type: accounts.type,
            balanceCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
        })
        .from(accounts)
        .leftJoin(transactions, eq(transactions.accountId, accounts.id))
        .where(
            and(
                eq(accounts.userId, userId),
                accountIds?.length ? inArray(accounts.id, accountIds) : undefined,
            ),
        )
        .groupBy(accounts.id)
        .orderBy(desc(accounts.createdAt));
}