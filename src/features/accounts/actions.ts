"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";
import { createAccountSchema } from "./schemas";
import { createAccount, deleteAccount } from "./service";

export type ActionState = { error?: string };

export async function createAccountAction(
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const session = await getSession();
    if (!session) return { error: "Not authenticated" };

    const parsed = createAccountSchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        initialBalanceCents: formData.get("initialBalanceCents"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const account = await createAccount(db, session.userId, parsed.data);
    if (!account.ok) return { error: account.error };

    logger.info({ action: "create_account", userId: session.userId, accountId: account.value.id });
    revalidatePath("/accounts");
    return {};
}

export async function deleteAccountAction(
    accountId: string,
): Promise<ActionState> {
    const session = await getSession();
    if (!session) return { error: "Not authenticated" };

    const result = await deleteAccount(db, session.userId, accountId);
    if (!result.ok) return { error: result.error };

    revalidatePath("/accounts");
    return {};
}