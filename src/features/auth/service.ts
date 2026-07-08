
import type { Database } from "@/src/db/client";
import { users } from "@/src/db/schema";

export async function findOrCreateUser(db: Database, email: string) {
  const [user] = await db
    .insert(users)
    .values({ email, createdAt: new Date() })
    .onConflictDoUpdate({
      target: users.email,
      set: { email }, // no-op: ensures RETURNING even on conflict
    })
    .returning();

  return user;
}