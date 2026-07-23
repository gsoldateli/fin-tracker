"use client"

import { useReducer, useState, useTransition, useCallback } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/src/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/src/features/accounts/components/money-input"
import {
  AccountListItem,
  formatCents,
} from "./account-list-item"
import {
  transferReducer,
  initialTransferState,
} from "./transfer-reducer"
import { transferAction } from "../actions"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CoinsSwapFreeIcons,
  ArrowUpDownFreeIcons,
  ArrowDown01FreeIcons,
  ArrowLeft02FreeIcons,
  Cancel01FreeIcons,
  Alert02FreeIcons,
} from "@hugeicons/core-free-icons"

interface AccountInfo {
  id: string
  name: string
  type: string
  balanceCents: number
}

interface TransferSheetProps {
  accounts: AccountInfo[]
}

function TransferFormContent({
  state,
  dispatch,
  accounts,
  fromAccount,
  toAccount,
  insufficientFunds,
  canSubmit,
  isPending,
  displayError,
  onSubmit,
}: {
  state: ReturnType<typeof transferReducer>
  dispatch: React.Dispatch<import("./transfer-reducer").TransferAction>
  accounts: AccountInfo[]
  fromAccount: AccountInfo | null
  toAccount: AccountInfo | null
  insufficientFunds: boolean
  canSubmit: boolean
  isPending: boolean
  displayError: string | null
  onSubmit: () => void
}) {
  const getFieldLabel = (field: "from" | "to") =>
    field === "from" ? "Choose source account" : "Choose destination account"

  const otherFieldId = (field: "from" | "to") =>
    field === "from" ? state.toId : state.fromId

  if (state.step !== "form") {
    const field = state.step === "pick-from" ? "from" : "to"
    const accountsToShow = accounts.filter(
      (a) => a.id !== otherFieldId(field),
    )

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 px-6 pt-4 pb-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "go-to-step", step: "form" })}
            className="flex items-center gap-1 text-primary transition-opacity hover:opacity-80 active:scale-95"
          >
            <HugeiconsIcon icon={ArrowLeft02FreeIcons} size={18} />
            <span className="text-sm font-semibold">Back</span>
          </button>
          <h2 className="flex-1 text-center text-base font-semibold text-foreground">
            {getFieldLabel(field)}
          </h2>
          <div className="w-[52px]" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {accountsToShow.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No accounts available
            </p>
          ) : (
            <div className="space-y-3">
              {accountsToShow.map((account) => (
                <AccountListItem
                  key={account.id}
                  {...account}
                  selected={
                    account.id ===
                    (field === "from" ? state.fromId : state.toId)
                  }
                  onSelect={() =>
                    dispatch({
                      type: "select-account",
                      field,
                      id: account.id,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between px-6 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold text-foreground">
Transfer
          </h2>
          <p className="text-sm text-muted-foreground">
            Move money between your accounts
          </p>
        </div>
        <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
          <HugeiconsIcon icon={Cancel01FreeIcons} size={16} />
          <span className="sr-only">Close</span>
        </Dialog.Close>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          <div className="relative flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "go-to-step", step: "pick-from" })
              }
              aria-label={fromAccount ? `From: ${fromAccount.name}, Balance: ${formatCents(fromAccount.balanceCents)}` : "Select source account"}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/20 active:scale-[0.98]"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                FROM
              </span>
              {fromAccount ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      {fromAccount.name}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01FreeIcons}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </div>
                  <span className="block text-sm text-muted-foreground">
                    Balance: {formatCents(fromAccount.balanceCents)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-base text-muted-foreground/60">
                    Select source account
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01FreeIcons}
                    size={16}
                    className="text-muted-foreground"
                  />
                </div>
              )}
            </button>

            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => dispatch({ type: "swap" })}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-md text-primary transition-all active:scale-95"
              >
                <HugeiconsIcon icon={ArrowUpDownFreeIcons} size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch({ type: "go-to-step", step: "pick-to" })
              }
              aria-label={toAccount ? `To: ${toAccount.name}, Balance: ${formatCents(toAccount.balanceCents)}` : "Select destination account"}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/20 active:scale-[0.98]"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                TO
              </span>
              {toAccount ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      {toAccount.name}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowDown01FreeIcons}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </div>
                  <span className="block text-sm text-muted-foreground">
                    Balance: {formatCents(toAccount.balanceCents)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-base text-muted-foreground/60">
                    Select destination account
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01FreeIcons}
                    size={16}
                    className="text-muted-foreground"
                  />
                </div>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AMOUNT
            </label>
            <div
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors",
                insufficientFunds
                  ? "border-destructive"
                  : "border-border focus-within:border-primary",
              )}
            >
              <MoneyInput
                allowNegative={false}
                value={state.amountCents}
                onChange={(cents) =>
                  dispatch({ type: "set-amount", cents })
                }
                aria-invalid={insufficientFunds || undefined}
              />
            </div>
            {fromAccount && state.amountCents > 0 && (
              <span
                className={cn(
                  "ml-1 text-xs",
                  insufficientFunds
                    ? "font-medium text-destructive"
                    : "text-muted-foreground",
                )}
              >
                Available: {formatCents(fromAccount.balanceCents)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              DESCRIPTION
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 transition-colors focus-within:border-primary">
              <Input
                type="text"
                value={state.description}
                onChange={(e) =>
                  dispatch({
                    type: "set-description",
                    value: e.target.value,
                  })
                }
                placeholder="Add description"
                className="h-auto border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {displayError && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl p-4 text-sm",
                insufficientFunds
                  ? "bg-destructive/10 text-destructive"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <HugeiconsIcon
                icon={Alert02FreeIcons}
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span className="font-medium">{displayError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-6 pt-4 pb-6">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isPending}
          className="h-14 w-full rounded-full text-base font-semibold"
        >
          {isPending ? "Transferring..." : "Transfer"}
        </Button>
      </div>
    </div>
  )
}

export function TransferSheet({ accounts }: TransferSheetProps) {
  const [open, setOpen] = useState(false)
  const [state, dispatch] = useReducer(transferReducer, initialTransferState)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fromAccount = accounts.find((a) => a.id === state.fromId) ?? null
  const toAccount = accounts.find((a) => a.id === state.toId) ?? null
  const insufficientFunds =
    fromAccount !== null && state.amountCents > fromAccount.balanceCents
  const canSubmit =
    !!state.fromId &&
    !!state.toId &&
    state.amountCents > 0 &&
    !insufficientFunds
  const displayError =
    serverError ?? (insufficientFunds ? "Insufficient balance" : null)

  const handleClose = useCallback(() => {
    setOpen(false)
    dispatch({ type: "reset" })
    setServerError(null)
  }, [])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) handleClose()
      else setOpen(true)
    },
    [handleClose],
  )

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isPending) return

    const formData = new FormData()
    formData.set("fromId", state.fromId!)
    formData.set("toId", state.toId!)
    formData.set("amountCents", String(state.amountCents))
    formData.set("description", state.description)

    startTransition(async () => {
      const result = await transferAction({}, formData)
      if (result?.error) {
        setServerError(result.error)
      } else {
        handleClose()
      }
    })
  }, [canSubmit, isPending, state, handleClose])

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-semibold whitespace-nowrap shadow-xs transition-all outline-none select-none",
          "h-14",
          "hover:bg-muted hover:text-foreground",
          "active:not-aria-[haspopup]:translate-y-px",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        )}
      >
        <HugeiconsIcon icon={CoinsSwapFreeIcons} size={22} />
        Transfer between accounts
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/10 backdrop-blur-sm",
            "transition-opacity duration-200",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed z-50 flex flex-col bg-background outline-none",
            "transition-transform duration-300 ease-out",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
            "data-starting-style:translate-y-4 data-ending-style:translate-y-4",
            "inset-x-0 bottom-0 max-h-[90%] rounded-t-[24px] border-t",
            "md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2",
            "md:max-w-md md:w-full md:rounded-xl md:border md:shadow-lg",
            "md:-translate-x-1/2 md:-translate-y-1/2",
            "md:h-auto md:max-h-[calc(100vh-6rem)]",
            "md:transition-all md:duration-200",
            "md:data-starting-style:scale-95 md:data-starting-style:translate-y-0",
            "md:data-ending-style:scale-95 md:data-ending-style:translate-y-0",
          )}
        >
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
          </div>
          <TransferFormContent
            state={state}
            dispatch={dispatch}
            accounts={accounts}
            fromAccount={fromAccount}
            toAccount={toAccount}
            insufficientFunds={insufficientFunds}
            canSubmit={canSubmit}
            isPending={isPending}
            displayError={displayError}
            onSubmit={handleSubmit}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
