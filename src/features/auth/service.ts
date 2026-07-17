import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Database } from "@/src/db/client";
import { accounts, transactionCategories, transactions, users } from "@/src/db/schema";
import { format, addDays, subDays } from "@/src/lib/date";

const DEFAULT_CATEGORIES = {
  expense: [
    "Food",
    "Housing",
    "Transportation",
    "Health",
    "Leisure",
    "Education",
    "Other",
  ],
  income: ["Salary", "Freelance", "Investments", "Other"],
} as const;

const CHECKING_INITIAL_CENTS = 300_000;
const MONTHLY_SALARY_CENTS = 750_000;
const MONTHLY_TRANSFER_CENTS = 166_700;

const MONTHLY_EXPENSES: Array<{
  description: string;
  categoryName: string;
  amountCents: number;
  dayOffset: number;
}> = [
  { description: "Rent", categoryName: "Housing", amountCents: -200_000, dayOffset: 1 },
  { description: "Groceries", categoryName: "Food", amountCents: -30_000, dayOffset: 5 },
  { description: "Gas", categoryName: "Transportation", amountCents: -20_000, dayOffset: 8 },
  { description: "Electricity", categoryName: "Housing", amountCents: -20_000, dayOffset: 10 },
  { description: "Health Plan", categoryName: "Health", amountCents: -25_000, dayOffset: 10 },
  { description: "Entertainment", categoryName: "Leisure", amountCents: -20_000, dayOffset: 12 },
  { description: "Eating Out", categoryName: "Food", amountCents: -20_000, dayOffset: 15 },
  { description: "Course", categoryName: "Education", amountCents: -10_000, dayOffset: 18 },
  { description: "Internet", categoryName: "Other", amountCents: -5_000, dayOffset: 22 },
];

export async function findOrCreateUser(db: Database, email: string, shouldSeed: boolean = true) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email, createdAt: new Date() })
      .onConflictDoUpdate({
        target: users.email,
        set: { email },
      })
      .returning();

    const [existingCategories] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(transactionCategories)
      .where(eq(transactionCategories.userId, user.id));

    if (existingCategories.count === 0) {
      const rows = [
        ...DEFAULT_CATEGORIES.expense.map((name) => ({
          userId: user.id,
          name,
          type: "expense" as const,
        })),
        ...DEFAULT_CATEGORIES.income.map((name) => ({
          userId: user.id,
          name,
          type: "income" as const,
        })),
      ];
      await tx.insert(transactionCategories).values(rows);
    }

    if (shouldSeed) {
      const [existingAccounts] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(accounts)
        .where(eq(accounts.userId, user.id));

      if (existingAccounts.count === 0) {
        const now = new Date();

        const checkingId = randomUUID();
        const savingsId = randomUUID();

        await tx.insert(accounts).values([
          { id: checkingId, userId: user.id, name: "Checking", type: "checking", createdAt: now },
          { id: savingsId, userId: user.id, name: "Savings", type: "savings", createdAt: now },
        ]);

        const categories = await tx
          .select()
          .from(transactionCategories)
          .where(eq(transactionCategories.userId, user.id));

        const categoryByName = new Map<string, string>();
        for (const cat of categories) {
          categoryByName.set(cat.name, cat.id);
        }

        const rows: (typeof transactions.$inferInsert)[] = [];

        const startDate = subDays(now, 90);

        rows.push({
          accountId: checkingId,
          userId: user.id,
          type: "initial_balance",
          amountCents: CHECKING_INITIAL_CENTS,
          description: "Initial balance",
          date: format(startDate, "yyyy-MM-dd"),
          createdAt: now,
        });

        for (let month = 0; month < 3; month++) {
          const monthBase = addDays(startDate, month * 30);

          rows.push({
            accountId: checkingId,
            userId: user.id,
            type: "income",
            categoryId: categoryByName.get("Salary"),
            amountCents: MONTHLY_SALARY_CENTS,
            description: "Salary",
            date: format(addDays(monthBase, 1), "yyyy-MM-dd"),
            createdAt: now,
          });

          for (const exp of MONTHLY_EXPENSES) {
            rows.push({
              accountId: checkingId,
              userId: user.id,
              type: "expense",
              categoryId: categoryByName.get(exp.categoryName),
              amountCents: exp.amountCents,
              description: exp.description,
              date: format(addDays(monthBase, exp.dayOffset), "yyyy-MM-dd"),
              createdAt: now,
            });
          }

          const transferGroupId = randomUUID();
          const transferDate = format(addDays(monthBase, 27), "yyyy-MM-dd");

          rows.push({
            accountId: checkingId,
            userId: user.id,
            type: "transfer",
            amountCents: -MONTHLY_TRANSFER_CENTS,
            transferGroupId,
            counterpartyAccountId: savingsId,
            description: "Transfer to Savings",
            date: transferDate,
            createdAt: now,
          });

          rows.push({
            accountId: savingsId,
            userId: user.id,
            type: "transfer",
            amountCents: MONTHLY_TRANSFER_CENTS,
            transferGroupId,
            counterpartyAccountId: checkingId,
            description: "Transfer from Checking",
            date: transferDate,
            createdAt: now,
          });
        }

        await tx.insert(transactions).values(rows);
      }
    }

    return user;
  });
}
