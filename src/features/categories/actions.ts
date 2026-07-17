"use server";

import { getDb } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { createCategorySchema } from "./schemas";
import { createCategory } from "./service";

export async function createCategoryAction(
  name: string,
  type: "income" | "expense",
): Promise<
  | { ok: true; category: { id: string; name: string; type: "income" | "expense" }; created: boolean }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not authenticated" };

  const parsed = createCategorySchema.safeParse({ name, type });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const db = getDb();
  const result = await createCategory(db, session.userId, parsed.data);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    category: { id: result.value.id, name: result.value.name, type: result.value.type },
    created: result.created,
  };
}
