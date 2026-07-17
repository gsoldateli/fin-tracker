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
import type { IconSvgElement } from "@hugeicons/react"

const TYPE_MAP: Record<string, { label: string; icon: IconSvgElement }> = {
  checking: { label: "Institution", icon: BankFreeIcons },
  cash: { label: "Cash", icon: Cash01FreeIcons },
  savings: { label: "Investment", icon: PiggyBankFreeIcons },
  credit: { label: "Credit", icon: CreditCardFreeIcons },
}

function formatBRL(c: number) {
  return (c / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={t.icon} size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.label}
            </p>
            <p className="text-base font-semibold text-foreground">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              neg && "text-destructive",
            )}
          >
            {formatBRL(balanceCents)}
          </span>
          <Link
            href={`/accounts/${id}/edit`}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <HugeiconsIcon icon={Edit01FreeIcons} size={18} />
          </Link>
        </div>
      </div>
    </Card>
  )
}
