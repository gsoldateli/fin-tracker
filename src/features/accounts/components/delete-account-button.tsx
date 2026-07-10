"use client";

import { useTransition } from "react";
import { deleteAccountAction } from "../actions";

export function DeleteAccountButton({ accountId }: { accountId: string }) {
    const [pending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
                await deleteAccountAction(accountId);
            })}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
        >
            {pending ? "Deleting..." : "Delete"}
        </button>
    );
}
