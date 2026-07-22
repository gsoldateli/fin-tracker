"use client";

import { useState, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { pushDigit, popDigit, formatCents } from "@/src/lib/money";

interface MoneyInputProps {
  name?: string;
  defaultCents?: number;
  value?: number;
  onChange?: (cents: number) => void;
  allowNegative?: boolean;
  "aria-invalid"?: boolean;
}

export function MoneyInput({
  name,
  defaultCents = 0,
  value: controlledValue,
  onChange: controlledOnChange,
  allowNegative = false,
  "aria-invalid": ariaInvalid,
}: MoneyInputProps) {
  const [internalCents, setInternalCents] = useState(defaultCents);
  const controlled = controlledOnChange !== undefined;
  const cents = controlled ? (controlledValue ?? 0) : internalCents;

  const setCents = useCallback(
    (nextCents: number | ((prev: number) => number)) => {
      if (controlled) {
        const next =
          typeof nextCents === "function" ? nextCents(controlledValue ?? 0) : nextCents;
        controlledOnChange?.(next);
      } else {
        setInternalCents(nextCents);
      }
    },
    [controlled, controlledValue, controlledOnChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow modifier combos (Ctrl/Cmd for copy/paste/select-all, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Allow navigation keys
    if (
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Home" ||
      e.key === "End"
    )
      return;

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      setCents((prev) => pushDigit(prev, parseInt(e.key, 10)));
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (e.shiftKey) {
        setCents(0);
      } else {
        setCents((prev) => popDigit(prev));
      }
      return;
    }

    if ((e.key === "-" || e.key === "+") && allowNegative) {
      e.preventDefault();
      setCents((prev) => -prev);
      return;
    }

    // Block anything else (letters, symbols)
    e.preventDefault();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "");
    if (digits) {
      const value = parseInt(digits, 10);
      if (!isNaN(value)) {
        const sign = cents < 0 ? -1 : 1;
        setCents(sign * value);
      }
    }
  };

  const displayValue = formatCents(cents);

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={() => {}}
        className="pl-8 font-medium"
        placeholder="$0.00"
        aria-invalid={ariaInvalid}
      />
      {name && <input type="hidden" name={name} value={cents} />}
    </div>
  );
}
