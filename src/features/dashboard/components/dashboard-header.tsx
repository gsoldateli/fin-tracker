"use client"

import { logoutAction } from "@/src/features/auth/actions"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01FreeIcons } from "@hugeicons/core-free-icons"

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function displayName(email: string): string {
  const local = email.split("@")[0]
  const first = local.split(/[._-]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {greeting()}, {displayName(email)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Check your financial health today.
        </p>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          title="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
        >
          <HugeiconsIcon icon={Logout01FreeIcons} size={20} />
        </button>
      </form>
    </header>
  )
}
