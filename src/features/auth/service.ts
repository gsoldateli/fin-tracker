import { eq, sql } from "drizzle-orm";
import type { Database } from "@/src/db/client";
import { transactionCategories, users } from "@/src/db/schema";

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

export async function findOrCreateUser(db: Database, email: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email, createdAt: new Date() })
      .onConflictDoUpdate({
        target: users.email,
        set: { email },
      })
      .returning();

    const [existing] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(transactionCategories)
      .where(eq(transactionCategories.userId, user.id));

    if (existing.count === 0) {
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

    return user;
  });
}