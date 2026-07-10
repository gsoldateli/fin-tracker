import { redirect } from "next/navigation"
import { getSession } from "@/src/lib/session"
import { db } from "@/src/db/client"
import { listAccountsWithBalance } from "@/src/features/accounts/queries"
import { AccountCard } from "@/src/features/accounts/components/account-card"
import { AccountsTable } from "@/src/features/accounts/components/accounts-table"
import { AccountActions } from "@/src/features/accounts/components/account-actions"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { Wallet01FreeIcons } from "@hugeicons/core-free-icons"

function formatBRL(c: number) {
  return (c / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export default async function AccountsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const accounts = await listAccountsWithBalance(db, session.userId)
  const total = accounts.reduce((s, a) => s + a.balanceCents, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-primary">My Accounts</h1>
        <div className="hidden sm:flex sm:gap-4">
          <AccountActions />
        </div>
      </header>

      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Balance
            </p>
            <p className="text-3xl font-bold text-foreground">
              {formatBRL(total)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={Wallet01FreeIcons} size={28} />
          </div>
        </CardContent>
      </Card>

      {/* Accounts */}
      {accounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No accounts yet.
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {accounts.map((a) => (
              <AccountCard key={a.id} {...a} />
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Accounts List
              </h2>
            </div>
            <AccountsTable accounts={accounts} />
          </Card>
        </>
      )}

      {/* Mobile actions */}
      <div className="md:hidden">
        <AccountActions />
      </div>
    </div>
  )
}
