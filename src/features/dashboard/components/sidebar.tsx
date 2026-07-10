"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { useIsActiveLink } from "@/src/lib/navigation"
import {
  Home01FreeIcons,
  ReceiptTextFreeIcons,
  BankFreeIcons,
  Chart01FreeIcons,
  Settings01FreeIcons,
} from "@hugeicons/core-free-icons"
import { cn } from "@/src/lib/utils"

const NAV = [
  { href: "/", label: "Home", icon: Home01FreeIcons },
  { href: "/transactions", label: "Transactions", icon: ReceiptTextFreeIcons },
  { href: "/accounts", label: "My Accounts", icon: BankFreeIcons },
  { href: "/reports", label: "Reports", icon: Chart01FreeIcons },
] as const

export function Sidebar({
  className,
  initials,
}: {
  className: string
  email?: string
  initials: string
}) {
  return (
    <aside className={cn("bg-card border-r border-border z-50", className)}>
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <span className="font-semibold text-foreground">Fin Tracker</span>
      </div>

      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon }) => {
          const active = useIsActiveLink(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 px-6 py-3 text-sm transition-all border-r-4 border-transparent",
                active
                  ? "bg-primary/15 text-primary border-r-4 border-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={icon} size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-6">
        <Link
          href="/settings"
          className="flex items-center gap-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={Settings01FreeIcons} size={20} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
