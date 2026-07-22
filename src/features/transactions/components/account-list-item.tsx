"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankFreeIcons,
  CheckmarkCircle01FreeIcons,
} from "@hugeicons/core-free-icons"
import { cn } from "@/src/lib/utils"
import { ACCOUNT_TYPE_MAP } from "@/src/features/accounts/constants"

export function formatBRL(c: number) {
  return (c / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

interface AccountListItemProps {
  id: string
  name: string
  type: string
  balanceCents: number
  selected?: boolean
  onSelect?: (id: string) => void
}

export function AccountListItem({
  id,
  name,
  type,
  balanceCents,
  selected = false,
  onSelect,
}: AccountListItemProps) {
  const t = ACCOUNT_TYPE_MAP[type] ?? {
    label: type,
    icon: BankFreeIcons,
  }
  const neg = balanceCents < 0

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={cn(
        "flex w-full @container flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:justify-between rounded-xl border p-4 transition-all active:scale-[0.98]",
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:border-primary/20",
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon icon={t.icon} size={22} />
        </div>
        <div className="flex min-w-0 flex-col text-left">
          <span className="truncate text-base font-semibold text-foreground">
            {name}
          </span>
          <span className="truncate text-sm text-muted-foreground">{t.label}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 self-end @[360px]:self-auto">
        <span
          className={cn(
            "text-base font-semibold tabular-nums",
            neg ? "text-destructive" : "text-foreground",
          )}
        >
          {formatBRL(balanceCents)}
        </span>
        {selected && (
          <HugeiconsIcon
            icon={CheckmarkCircle01FreeIcons}
            size={20}
            className="text-primary"
          />
        )}
      </div>
    </button>
  )
}
