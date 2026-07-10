"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankFreeIcons,
  PiggyBankFreeIcons,
  Cash01FreeIcons,
  CreditCardFreeIcons,
  ArrowLeft01FreeIcons,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";
import { MoneyInput } from "./money-input";
import type { ActionState } from "../actions";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking" as const, label: "Checking", icon: BankFreeIcons },
  { value: "savings" as const, label: "Savings", icon: PiggyBankFreeIcons },
  { value: "cash" as const, label: "Cash", icon: Cash01FreeIcons },
  { value: "credit" as const, label: "Credit", icon: CreditCardFreeIcons },
];

interface AccountFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name: string;
    type: string;
    initialBalanceCents?: number;
  };
}

export function AccountForm({ action, defaultValues }: AccountFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [selectedType, setSelectedType] = useState(defaultValues?.type ?? "checking");
  const isEditing = !!defaultValues;

  const nameError = state.fieldErrors?.name;
  const balanceError = state.fieldErrors?.balance;
  const generalError = state.error;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/accounts"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <HugeiconsIcon icon={ArrowLeft01FreeIcons} size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? "Edit account" : "New account"}
        </h1>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Nome da conta */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Account name
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="e.g. Nubank"
            required
            autoFocus
            aria-invalid={!!nameError}
          />
          {nameError && (
            <p className="text-sm text-destructive" role="alert">
              {nameError}
            </p>
          )}
        </div>

        {/* Tipo de conta */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account type
          </legend>
          <RadioGroupPrimitive
            value={selectedType}
            onValueChange={(value) => value && setSelectedType(value)}
            className="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {ACCOUNT_TYPE_OPTIONS.map(({ value, label, icon }) => (
              <RadioPrimitive.Root
                key={value}
                value={value}
                className={cn(
                  "group flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 outline-none transition-all select-none",
                  "data-[checked]:border-primary data-[checked]:bg-primary/5",
                  "data-[unchecked]:border-border data-[unchecked]:bg-card",
                  "hover:scale-[1.02]",
                  "focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                    "group-data-[checked]:bg-primary/10 group-data-[unchecked]:bg-muted",
                  )}
                >
                  <HugeiconsIcon
                    icon={icon}
                    size={24}
                    className="group-data-[checked]:text-primary group-data-[unchecked]:text-muted-foreground"
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </RadioPrimitive.Root>
            ))}
          </RadioGroupPrimitive>
          <input type="hidden" name="type" value={selectedType} />
        </fieldset>

        {/* Saldo inicial */}
        <div className="space-y-2">
          <label
            htmlFor="initialBalance"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Initial balance (optional)
          </label>
          <MoneyInput
            name="initialBalanceCents"
            defaultCents={defaultValues?.initialBalanceCents ?? 0}
            allowNegative
            aria-invalid={!!balanceError}
          />
          <p className="text-xs italic text-muted-foreground">
            Use negative values for outstanding invoices
          </p>
          {balanceError && (
            <p className="text-sm text-destructive" role="alert">
              {balanceError}
            </p>
          )}
        </div>

        {/* General error */}
        {generalError && (
          <p className="text-sm text-destructive" role="alert">
            {generalError}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="h-14 w-full rounded-full text-base font-semibold"
          disabled={pending}
        >
          {pending ? "Saving…" : isEditing ? "Save" : "Create account"}
        </Button>

        {/* Cancel */}
        <div className="flex justify-center">
          <Link
            href="/accounts"
            className="py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
