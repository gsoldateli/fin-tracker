import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsSwapFreeIcons, Add01FreeIcons } from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"

export function AccountActions() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
      <Button
        variant="outline"
        className="flex items-center gap-2 py-6 text-base"
        disabled
      >
        <HugeiconsIcon icon={CoinsSwapFreeIcons} size={22} />
        Transfer between accounts
      </Button>
      <Link
        href="/accounts/new"
        className={buttonVariants({
          className: "flex items-center gap-2 py-6 text-base",
        })}
      >
        <HugeiconsIcon icon={Add01FreeIcons} size={22} />
        New account
      </Link>
    </div>
  )
}
