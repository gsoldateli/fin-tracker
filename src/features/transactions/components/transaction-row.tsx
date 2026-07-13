import type { TransactionWithRelations } from "../queries";
import { formatCentsToReal } from "@/src/lib/money";
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

export function TransactionRow({ tx }: { tx: TransactionWithRelations }) {
  const cfg = typeConfig[tx.type] ?? typeConfig.initial_balance;
  const amountText = formatCentsToReal(Math.abs(tx.amountCents));
  const isTransfer = tx.type === "transfer";

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-colors active:bg-accent/50">
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

      <span
        className={`shrink-0 text-base font-semibold tabular-nums ${cfg.amountColor}`}
      >
        {cfg.prefix}
        {amountText}
      </span>
    </div>
  );
}
