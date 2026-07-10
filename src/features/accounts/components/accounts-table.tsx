import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankFreeIcons,
  Cash01FreeIcons,
  PiggyBankFreeIcons,
  CreditCardFreeIcons,
  Edit01FreeIcons,
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { cn } from "@/src/lib/utils"
import type { IconSvgElement } from "@hugeicons/react"

const TYPE_MAP: Record<string, { label: string; icon: IconSvgElement }> = {
  checking: { label: "Checking", icon: BankFreeIcons },
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

type Account = { id: string; name: string; type: string; balanceCents: number }

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Institution</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-center w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((a) => {
          const t = TYPE_MAP[a.type] ?? { label: a.type, icon: BankFreeIcons }
          const neg = a.balanceCents < 0
          return (
            <TableRow key={a.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <HugeiconsIcon icon={t.icon} size={20} />
                  </div>
                  <span className="font-medium text-foreground">
                    {a.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t.label}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  neg && "text-destructive",
                )}
              >
                {formatBRL(a.balanceCents)}
              </TableCell>
              <TableCell className="text-center">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 active:scale-95"
                >
                  <HugeiconsIcon icon={Edit01FreeIcons} size={16} />
                </button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
