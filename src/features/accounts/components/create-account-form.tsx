"use client";

import { useActionState } from "react";
import { createAccountAction, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_TYPES } from "../schemas";

export function CreateAccountForm() {
    const [state, formAction, pending] = useActionState<ActionState, FormData>(createAccountAction, {});

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                    Name
                </label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Main Checking"
                    required
                    autoFocus
                />
            </div>

            <div>
                <label htmlFor="type" className="mb-1 block text-sm font-medium">
                    Type
                </label>
                <select
                    id="type"
                    name="type"
                    required
                    className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs"
                >
                    {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="initialBalanceCents" className="mb-1 block text-sm font-medium">
                    Initial balance (cents)
                </label>
                <Input
                    id="initialBalanceCents"
                    name="initialBalanceCents"
                    type="number"
                    step="1"
                    placeholder="0"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Leave as 0 to start with an empty account.
                </p>
            </div>

            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating..." : "Create account"}
            </Button>
        </form>
    );
}
