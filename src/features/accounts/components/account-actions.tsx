import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsSwapFreeIcons, Add01FreeIcons } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export function AccountActions() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        className="flex items-center gap-2 h-14 px-6 text-base font-semibold rounded-full"
        disabled
      >
        <HugeiconsIcon icon={CoinsSwapFreeIcons} size={22} />
        Transfer between accounts
      </Button>
      <Button
        render={<Link href="/accounts/new" />}
        className="flex items-center gap-2 h-14 px-6 text-base font-semibold rounded-full"
      >
        <HugeiconsIcon icon={Add01FreeIcons} size={22} />
        New account
      </Button>
    </div>
  )
}
