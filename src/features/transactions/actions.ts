"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";
import { transferSchema } from "@/src/features/accounts/schemas";
import { transfer } from "@/src/features/accounts/service";
import type { ActionState } from "@/src/features/accounts/actions";

export async function transferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const parsed = transferSchema.safeParse({
    fromId: formData.get("fromId"),
    toId: formData.get("toId"),
    amountCents: Number(formData.get("amountCents")),
    description: formData.get("description")?.toString()?.trim() || undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0].path[0] as string;
    return { fieldErrors: { [field]: parsed.error.issues[0].message } };
  }

  const db = getDb();
  const result = await transfer(db, session.userId, parsed.data);

  if (!result.ok) {
    switch (result.error) {
      case "INSUFFICIENT_FUNDS":
        return { error: "Insufficient balance" };
      case "SAME_ACCOUNT":
        return { error: "Cannot transfer to the same account" };
      case "ACCOUNT_NOT_FOUND":
        return { error: "Account not found" };
      case "INVALID_AMOUNT":
        return { error: "Invalid amount" };
    }
  }

  logger.info({
    action: "transfer",
    userId: session.userId,
    transferGroupId: result.value.transferGroupId,
  });

  revalidatePath("/accounts");

  return {};
}
