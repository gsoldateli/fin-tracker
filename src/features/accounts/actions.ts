"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";
import { createAccountSchema, updateAccountSchema } from "./schemas";
import { createAccount, updateAccount, deleteAccount } from "./service";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

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
    if (!parsed.success) {
        const field = parsed.error.issues[0].path[0] as string;
        return { fieldErrors: { [field]: parsed.error.issues[0].message } };
    }

    const account = await createAccount(db, session.userId, parsed.data);
    if (!account.ok) {
        if (account.error === "ACCOUNT_NAME_ALREADY_EXISTS") {
            return { fieldErrors: { name: "Já existe uma conta com esse nome" } };
        }
        return { error: account.error };
    }

    logger.info({ action: "create_account", userId: session.userId, accountId: account.value.id });
    revalidatePath("/accounts");
    redirect("/accounts");
}

export async function updateAccountAction(
    accountId: string,
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const session = await getSession();
    if (!session) return { error: "Not authenticated" };

    const parsed = updateAccountSchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        initialBalanceCents: formData.get("initialBalanceCents"),
    });
    if (!parsed.success) {
        const field = parsed.error.issues[0].path[0] as string;
        return { fieldErrors: { [field]: parsed.error.issues[0].message } };
    }

    const result = await updateAccount(db, session.userId, accountId, parsed.data);
    if (!result.ok) {
        if (result.error === "ACCOUNT_NAME_ALREADY_EXISTS") {
            return { fieldErrors: { name: "Já existe uma conta com esse nome" } };
        }
        return { error: result.error };
    }

    logger.info({ action: "update_account", userId: session.userId, accountId });
    revalidatePath("/accounts");
    redirect("/accounts");
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