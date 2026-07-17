"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/src/db/client";
import { getSession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";
import { createAccountSchema, updateAccountSchema } from "./schemas";
import { createAccount, updateAccount, deleteAccount } from "./service";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  transactionId?: string;
  type?: string;
  amountCents?: number;
  accountId?: string;
  categoryId?: string | null;
  date?: string;
  description?: string | null;
  action?: string;
};

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
        initialBalanceDate: formData.get("initialBalanceDate")?.toString() || undefined,
    });
    if (!parsed.success) {
        const field = parsed.error.issues[0].path[0] as string;
        return { fieldErrors: { [field]: parsed.error.issues[0].message } };
    }
    const db = getDb()
    const account = await createAccount(db, session.userId, parsed.data);
    if (!account.ok) {
        if (account.error === "ACCOUNT_NAME_ALREADY_EXISTS") {
            return { fieldErrors: { name: "An account with this name already exists" } };

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
        initialBalanceDate: formData.get("initialBalanceDate")?.toString() || undefined,
    });
    if (!parsed.success) {
        const field = parsed.error.issues[0].path[0] as string;
        return { fieldErrors: { [field]: parsed.error.issues[0].message } };
    }
    const db = getDb()
    const result = await updateAccount(db, session.userId, accountId, parsed.data);
    if (!result.ok) {
        if (result.error === "ACCOUNT_NAME_ALREADY_EXISTS") {
            return { fieldErrors: { name: "An account with this name already exists" } };
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

    const db = getDb()
    const result = await deleteAccount(db, session.userId, accountId);
    if (!result.ok) return { error: result.error };

    revalidatePath("/accounts");
    redirect("/accounts");
}