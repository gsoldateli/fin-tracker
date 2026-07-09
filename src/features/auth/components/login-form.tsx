"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
    const [state, formAction, pending] = useActionState(loginAction, {});

    return (
        <form action={formAction} className="space-y-4 w-full max-w-sm">
            <Input
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoFocus
            />
            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Entrando..." : "Entrar"}
            </Button>
        </form>
    );
}