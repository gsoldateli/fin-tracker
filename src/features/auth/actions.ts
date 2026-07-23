"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/src/db/client";
import { loginSchema } from "./schemas";
import { findOrCreateUser } from "./service";
import { createSession, destroySession } from "@/src/lib/session";
import { logger } from "@/src/lib/logger";

export type LoginState = { error?: string };

export async function loginAction(
    _prev: LoginState,
    formData: FormData
): Promise<LoginState> {
    const parsed = loginSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }
    const db = getDb()
    const start = Date.now();
    const user = await findOrCreateUser(db, parsed.data.email);
    await createSession(user.id);

    logger.info({
        action: "login",
        userId: user.id,
        durationMs: Date.now() - start,
        outcome: "ok",
    });

    redirect("/dashboard");
}

export async function logoutAction() {
    await destroySession();
    redirect("/");
}