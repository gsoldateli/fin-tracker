"use client";

import type { TransactionWithRelations } from "../queries";
import { formatCents } from "@/src/lib/money";
import { cn } from "@/src/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneyReceive01FreeIcons,
  MoneySend01FreeIcons,
  TransactionFreeIcons,
  Money01FreeIcons,
} from "@hugeicons/core-free-icons";

const typeConfig = {
  income: {
    icon: MoneyReceive01FreeIcons,
    bg: "bg-primary/10",
    textColor: "text-primary",
    amountColor: "text-green-600",
    prefix: "+",
  },
  expense: {
    icon: MoneySend01FreeIcons,
    bg: "bg-destructive/10",
    textColor: "text-destructive",
    amountColor: "text-destructive",
    prefix: "-",
  },
  transfer: {
    icon: TransactionFreeIcons,
    bg: "bg-muted",
    textColor: "text-muted-foreground",
    amountColor: "text-muted-foreground",
    prefix: "",
  },
  initial_balance: {
    icon: Money01FreeIcons,
    bg: "bg-muted",
    textColor: "text-muted-foreground",
    amountColor: "text-muted-foreground",
    prefix: "",
  },
} as const;

export function TransactionRow({
  tx,
  onEdit,
  readOnly = false,
}: {
  tx: TransactionWithRelations;
  onEdit?: (tx: TransactionWithRelations) => void;
  readOnly?: boolean;
}) {
  const cfg = typeConfig[tx.type] ?? typeConfig.initial_balance;
  const amountText = formatCents(Math.abs(tx.amountCents));
  const isTransfer = tx.type === "transfer";

  const Component = readOnly ? "div" : "button";
  const buttonProps = readOnly ? {} : { type: "button" as const, onClick: () => onEdit?.(tx) };

  return (
    <Component
      {...buttonProps}
      className={cn(
        "flex w-full @container rounded-2xl bg-card p-4 shadow-sm text-left overflow-hidden",
        !readOnly && "transition-colors active:bg-accent/50",
      )}
    >
      <div className="flex flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
          >
            <HugeiconsIcon
              icon={cfg.icon}
              className={`h-5 w-5 ${cfg.textColor}`}
              size={20}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-medium text-foreground">
              {tx.description || "No description"}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {tx.categoryName ?? tx.accountName}
              {tx.categoryName && <span> · {tx.accountName}</span>}
              {isTransfer && tx.counterpartyAccountName && (
                <span> → {tx.counterpartyAccountName}</span>
              )}
            </span>
          </div>
        </div>

        <span
          className={`self-end @[360px]:self-auto @[360px]:ml-auto shrink-0 text-base font-semibold tabular-nums ${cfg.amountColor}`}
        >
          {cfg.prefix}
          {amountText}
        </span>
      </div>
    </Component>
  );
}
