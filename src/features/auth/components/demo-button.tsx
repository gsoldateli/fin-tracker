"use client";

import { useTransition } from "react";
import { demoAction } from "../actions";
import { Button } from "@/components/ui/button";

export function DemoButton() {
    const [pending, startTransition] = useTransition();

    return (
        <Button
            onClick={() => startTransition(demoAction)}
            disabled={pending}
            className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-full"
        >
            {pending ? "Entering..." : "Try the demo"}
        </Button>
    );
}
