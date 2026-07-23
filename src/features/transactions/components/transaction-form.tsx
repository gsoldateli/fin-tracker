"use client";

import { useReducer, useState, useRef, useEffect, useTransition, useCallback } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoneyReceive01FreeIcons, MoneySend01FreeIcons, Cancel01FreeIcons } from "@hugeicons/core-free-icons";
import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoneyInput } from "@/src/features/accounts/components/money-input";
import { toast } from "sonner";
import { saveTransactionAction, deleteTransactionAction } from "../actions";
import { getTodayCivilDate } from "@/src/lib/date";
import { CategoryPicker } from "@/src/features/categories/components/category-picker";
import { AccountPicker } from "@/src/features/accounts/components/account-picker";

type FormType = "expense" | "income";

type FormState = {
  type: FormType;
  amountCents: number;
  accountId: string;
  categoryId: string;
  date: string;
  description: string;
};

type FormAction =
  | { type: "SET_TYPE"; value: FormType }
  | { type: "SET_AMOUNT"; value: number }
  | { type: "SET_ACCOUNT"; value: string }
  | { type: "SET_CATEGORY"; value: string }
  | { type: "SET_DATE"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "RESET_KEEPING"; payload: Partial<FormState> }
  | { type: "LOAD"; state: FormState };

function buildInitialState(from?: {
  type?: string;
  amountCents?: number;
  accountId?: string;
  categoryId?: string | null;
  date?: string;
  description?: string | null;
}): FormState {
  return {
    type: (from?.type as FormType) ?? "expense",
    amountCents: from?.amountCents ?? 0,
    accountId: from?.accountId ?? "",
    categoryId: from?.categoryId ?? "",
    date: from?.date ?? getTodayCivilDate(),
    description: from?.description ?? "",
  };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_TYPE":
      return { ...state, type: action.value, categoryId: "" };
    case "SET_AMOUNT":
      return { ...state, amountCents: action.value };
    case "SET_ACCOUNT":
      return { ...state, accountId: action.value };
    case "SET_CATEGORY":
      return { ...state, categoryId: action.value };
    case "SET_DATE":
      return { ...state, date: action.value };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value };
    case "RESET_KEEPING":
      return { ...state, ...action.payload };
    case "LOAD":
      return action.state;
  }
}

const ERROR_MAP: Record<string, string> = {
  NOT_FOUND: "Transaction not found",
  WRONG_TYPE: "Only income and expense transactions can be edited",
  INVALID_AMOUNT: "Invalid amount",
  ACCOUNT_NOT_FOUND: "Account not found",
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_TYPE_MISMATCH: "Category type does not match",
  INSUFFICIENT_FUNDS: "Insufficient balance",
};

interface EditTxData {
  transactionId: string;
  defaultValues: {
    type: "income" | "expense";
    amountCents: number;
    accountId: string;
    categoryId: string | null;
    date: string;
    description: string | null;
  };
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: { id: string; name: string; type: string; balanceCents: number }[];
  categories: { id: string; name: string; type: "income" | "expense" }[];
  transactionId?: string;
  defaultValues?: EditTxData["defaultValues"];
  onTransactionCreated?: (data: EditTxData) => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  accounts,
  categories,
  transactionId,
  defaultValues,
  onTransactionCreated,
}: TransactionFormProps) {
  const isEditing = !!transactionId;
  const [state, dispatch] = useReducer(
    formReducer,
    defaultValues,
    (dv) => buildInitialState(dv),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletePending, startDeleteTransition] = useTransition();
  const [saveMorePending, startSaveMoreTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const amountContainerRef = useRef<HTMLDivElement>(null);
  const batchCountRef = useRef(0);

  useEffect(() => {
    if (open) {
      dispatch({ type: "LOAD", state: buildInitialState(defaultValues) });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitError(null);
      batchCountRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transactionId]);

  useEffect(() => {
    if (open) {
      const el = amountContainerRef.current?.querySelector("input");
      const id = setTimeout(() => el?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [open]);

  const buildFormData = useCallback((): FormData => {
    const fd = new FormData();
    fd.set("type", state.type);
    fd.set("amountCents", String(state.amountCents));
    fd.set("accountId", state.accountId);
    fd.set("categoryId", state.categoryId);
    fd.set("date", state.date);
    fd.set("description", state.description);
    if (transactionId) fd.set("transactionId", transactionId);
    return fd;
  }, [state, transactionId]);

  const isFormValid = state.amountCents > 0 && state.accountId !== "";
  const errorMessage = submitError ? (ERROR_MAP[submitError] ?? submitError) : null;
  const isLoading = isSubmitting || saveMorePending || deletePending;

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isFormValid || isSubmitting) return;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const result = await saveTransactionAction({}, buildFormData());
        if (!result.success) {
          setSubmitError(result.error ?? "Unknown error");
          return;
        }

        if (!isEditing && result.action === "create") {
          const data: EditTxData = {
            transactionId: result.transactionId!,
            defaultValues: {
              type: result.type as "income" | "expense",
              amountCents: result.amountCents!,
              accountId: result.accountId!,
              categoryId: result.categoryId ?? null,
              date: result.date!,
              description: result.description ?? null,
            },
          };
          batchCountRef.current = 0;
          onTransactionCreated?.(data);
        }
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isFormValid, isSubmitting, isEditing, buildFormData, onTransactionCreated, onOpenChange],
  );

  function handleSaveAndCreateAnother() {
    if (!isFormValid) return;
    setSubmitError(null);
    startSaveMoreTransition(async () => {
      const result = await saveTransactionAction({}, buildFormData());
      if (result.success) {
        batchCountRef.current += 1;
        const count = batchCountRef.current;
        if (count === 1) {
          toast.success("1 transaction created", { duration: 2000 });
        } else {
          toast.success(`${count} transactions created`, { id: "batch-toast", duration: 2000 });
        }
        dispatch({
          type: "RESET_KEEPING",
          payload: { amountCents: 0, categoryId: "", description: "" },
        });
        const el = amountContainerRef.current?.querySelector("input");
        setTimeout(() => el?.focus(), 100);
      }
    });
  }

  function handleDelete() {
    if (!transactionId) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteTransactionAction(transactionId);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeleteDialogOpen(false);
        onOpenChange(false);
      }
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/10 backdrop-blur-sm",
            "transition-opacity duration-200",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <DialogPrimitive.Popup
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

          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="relative flex min-h-0 flex-1 flex-col"
          >

            <div className="flex shrink-0 items-start justify-between px-6 pt-4 pb-2">
              <h2 className="text-xl font-bold text-foreground">
                {isEditing ? "Edit transaction" : "New transaction"}
              </h2>
              <DialogPrimitive.Close className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
                <HugeiconsIcon icon={Cancel01FreeIcons} size={16} />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              <div className="flex rounded-xl bg-muted p-1">
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => dispatch({ type: "SET_TYPE", value: "expense" })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all min-h-[44px]",
                    state.type === "expense"
                      ? "bg-destructive/10 text-destructive shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                    isEditing && "cursor-not-allowed opacity-50",
                  )}
                >
                  <HugeiconsIcon icon={MoneySend01FreeIcons} size={20} />
                  Expense
                </button>
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => dispatch({ type: "SET_TYPE", value: "income" })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all min-h-[44px]",
                    state.type === "income"
                      ? "bg-primary/10 text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                    isEditing && "cursor-not-allowed opacity-50",
                  )}
                >
                  <HugeiconsIcon icon={MoneyReceive01FreeIcons} size={20} />
                  Income
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Amount
                </label>
                <div
                  ref={amountContainerRef}
                  className={cn(
                    "rounded-xl bg-card transition-colors focus-within:border-primary",
                    state.type === "expense" && "focus-within:border-destructive",
                  )}
                >
                  <MoneyInput
                    allowNegative={false}
                    value={state.amountCents}
                    onChange={(cents) =>
                      dispatch({ type: "SET_AMOUNT", value: cents })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <CategoryPicker
                  categories={categories}
                  selectedId={state.categoryId}
                  onSelect={(id) => dispatch({ type: "SET_CATEGORY", value: id })}
                  type={state.type}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Account
                </label>
                <AccountPicker
                  accounts={accounts}
                  selectedId={state.accountId}
                  onSelect={(id) => dispatch({ type: "SET_ACCOUNT", value: id })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  value={state.date}
                  onChange={(e) =>
                    dispatch({ type: "SET_DATE", value: e.target.value })
                  }
                  className="h-12 w-full min-h-[44px] rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 transition-colors focus-within:border-primary">
                  <Input
                    id="description"
                    type="text"
                    value={state.description}
                    onChange={(e) =>
                      dispatch({ type: "SET_DESCRIPTION", value: e.target.value })
                    }
                    placeholder="Add description"
                    className="h-auto min-h-[44px] border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-6 pt-4 pb-6 space-y-3">
              {isEditing ? (
                <Button
                  type="submit"
                  className="h-14 w-full rounded-full text-base font-semibold"
                  disabled={!isFormValid || isLoading}
                >
                  {isSubmitting ? "Saving…" : "Save"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 h-14 rounded-full text-base font-semibold"
                    disabled={!isFormValid || isLoading}
                  >
                    {isSubmitting ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-14 rounded-full text-base font-semibold"
                    disabled={!isFormValid || isLoading}
                    onClick={handleSaveAndCreateAnother}
                  >
                    {saveMorePending ? "Saving…" : "Save & create another"}
                  </Button>
                </div>
              )}

              {isEditing && (
                <>
                  <Separator />
                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                  >
                    <AlertDialogTrigger
                      render={
                        <button
                          type="button"
                          className="w-full min-h-[44px] py-3 text-sm font-semibold text-destructive/70 hover:text-destructive transition-colors"
                        >
                          Delete transaction
                        </button>
                      }
                    />
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this transaction?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {deleteError && (
                        <p className="text-sm text-destructive" role="alert">
                          {deleteError}
                        </p>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={deletePending}
                          onClick={handleDelete}
                        >
                          {deletePending ? "Deleting…" : "Delete"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
