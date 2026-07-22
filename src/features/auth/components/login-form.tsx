"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
    const [state, formAction, pending] = useActionState(loginAction, {});

    return (
        <form action={formAction} className="space-y-4 w-full max-w-sm">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    autoFocus
                />
            </div>
            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Entering..." : "Continue"}
            </Button>
        </form>
    );
}