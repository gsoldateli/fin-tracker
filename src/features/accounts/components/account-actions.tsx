"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsSwapFreeIcons, Add01FreeIcons } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { CreateAccountForm } from "./create-account-form"

export function AccountActions() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="flex items-center gap-2 py-6 text-base"
          disabled
        >
          <HugeiconsIcon icon={CoinsSwapFreeIcons} size={22} />
          Transfer between accounts
        </Button>
        <Button
          className="flex items-center gap-2 py-6 text-base"
          onClick={() => setOpen((v) => !v)}
        >
          <HugeiconsIcon icon={Add01FreeIcons} size={22} />
          New account
        </Button>
      </div>

      {open && (
        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">New Account</h2>
          <CreateAccountForm />
        </section>
      )}
    </>
  )
}
