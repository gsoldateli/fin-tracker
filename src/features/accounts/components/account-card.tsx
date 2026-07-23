import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankFreeIcons,
  Cash01FreeIcons,
  PiggyBankFreeIcons,
  CreditCardFreeIcons,
  Edit01FreeIcons,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { cn } from "@/src/lib/utils"
import { formatCents } from "@/src/lib/money"
import type { IconSvgElement } from "@hugeicons/react"

const TYPE_MAP: Record<string, { label: string; icon: IconSvgElement }> = {
  checking: { label: "Institution", icon: BankFreeIcons },
  cash: { label: "Cash", icon: Cash01FreeIcons },
  savings: { label: "Investment", icon: PiggyBankFreeIcons },
  credit: { label: "Credit", icon: CreditCardFreeIcons },
}

export function AccountCard({
  id,
  name,
  type,
  balanceCents,
}: {
  id: string
  name: string
  type: string
  balanceCents: number
}) {
  const t = TYPE_MAP[type] ?? { label: type, icon: BankFreeIcons }
  const neg = balanceCents < 0

  return (
    <Card>
      <div className="@container">
        <div className="flex flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:justify-between p-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon icon={t.icon} size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.label}
              </p>
              <p className="truncate text-base font-semibold text-foreground">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end @[360px]:self-auto">
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                neg && "text-destructive",
              )}
            >
              {formatCents(balanceCents)}
            </span>
            <Link
              href={`/accounts/${id}/edit`}
              className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <HugeiconsIcon icon={Edit01FreeIcons} size={18} />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
