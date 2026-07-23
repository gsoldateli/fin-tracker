import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01FreeIcons } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { TransferSheet } from "@/src/features/transactions/components/transfer-sheet"

interface AccountInfo {
  id: string
  name: string
  type: string
  balanceCents: number
}

export function AccountActions({ accounts }: { accounts: AccountInfo[] }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
      <TransferSheet accounts={accounts} />
      <Button
        nativeButton={false}
        render={<Link href="/dashboard/accounts/new" />}
        className="flex items-center gap-2 h-14 px-6 text-base font-semibold rounded-full"
      >
        <HugeiconsIcon icon={Add01FreeIcons} size={22} />
        New account
      </Button>
    </div>
  )
}
