"use client";

import { useState, type KeyboardEvent, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { pushDigit, popDigit, formatCentsToReal } from "@/src/lib/money";

interface MoneyInputProps {
  name: string;
  defaultCents?: number;
  allowNegative?: boolean;
  "aria-invalid"?: boolean;
}

export function MoneyInput({
  name,
  defaultCents = 0,
  allowNegative = false,
  "aria-invalid": ariaInvalid,
}: MoneyInputProps) {
  const [cents, setCents] = useState(defaultCents);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      setCents((prev) => pushDigit(prev, parseInt(e.key, 10)));
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      setCents((prev) => popDigit(prev));
      return;
    }

    if ((e.key === "-" || e.key === "+") && allowNegative) {
      e.preventDefault();
      setCents((prev) => -prev);
      return;
    }

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

  const negative = cents < 0;
  const displayValue = formatCentsToReal(Math.abs(cents));

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
        {negative ? "-R$" : "R$"}
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={() => { }}
        className="pl-12 text-lg font-medium"
        placeholder="0,00"
        aria-invalid={ariaInvalid}
      />
      <input type="hidden" name={name} value={cents} />
    </div>
  );
}
