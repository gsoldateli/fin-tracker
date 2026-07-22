"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { useIsActiveLink } from "@/src/lib/navigation"
import {
  Home01FreeIcons,
  ReceiptTextFreeIcons,
  BankFreeIcons,
} from "@hugeicons/core-free-icons"
import { cn } from "@/src/lib/utils"
import type { IconSvgElement } from "@hugeicons/react"

const TABS: { href: string; label: string; icon: IconSvgElement; exact?: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: Home01FreeIcons, exact: true },
  { href: "/dashboard/accounts", label: "Accounts", icon: BankFreeIcons },
  { href: "/dashboard/transactions", label: "Transactions", icon: ReceiptTextFreeIcons },
  // { href: "/reports", label: "Reports", icon: Chart01FreeIcons },
]

function NavItem({ href, label, icon, exact }: { href: string; label: string; icon: IconSvgElement; exact?: boolean }) {
  const active = useIsActiveLink(href, exact)
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 h-full min-w-[64px] px-4 transition-all",
        active
          ? "bg-primary/10 text-primary font-semibold border-t border-t-primary shadow-[inset_0_2px_0_0_hsl(var(--primary))]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <HugeiconsIcon icon={icon} size={22} />
      <span className="text-[10px]">{label}</span>
    </Link>
  )
}

export function BottomNav({ className }: { className: string }) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50",
        className,
      )}
    >
      <div className="flex items-center justify-around h-16 px-4 gap-1">
        {TABS.map(({ href, label, icon, exact }) => (
          <NavItem key={href} href={href} label={label} icon={icon} exact={exact} />
        ))}
      </div>
    </nav>
  )
}
