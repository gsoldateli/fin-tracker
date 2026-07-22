"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilterBar } from "./filter-bar";
import { TransactionList } from "./transaction-list";
import { NewTransactionFab } from "./new-transaction-fab";
import { TransactionForm } from "./transaction-form";
import type { TransactionWithRelations } from "../queries";

type Filters = {
  period?: string;
  type?: string;
  account?: string;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
};

type Props = {
  initialItems: TransactionWithRelations[];
  initialCursor: { date: string; createdAt: number; id: string } | null;
  filters: Filters;
  filterHash: string;
  accounts: { id: string; name: string; type: string; balanceCents: number }[];
  categories: { id: string; name: string; type: "income" | "expense" }[];
  basePath?: string;
};

export function TransactionsShell({
  initialItems,
  initialCursor,
  filters,
  filterHash,
  accounts,
  categories,
  basePath = "/dashboard/transactions",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<{
    transactionId: string;
    defaultValues: {
      type: "income" | "expense";
      amountCents: number;
      accountId: string;
      categoryId: string | null;
      date: string;
      description: string | null;
    };
  } | null>(null);
  const [listKey, setListKey] = useState(0);

  const isFormOpen = formOpen || !!editingTx;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFormOpen(false);
      setEditingTx(null);
      setListKey((k) => k + 1);
    }
  }

  const handleEdit = useCallback((tx: TransactionWithRelations) => {
    if (tx.type !== "income" && tx.type !== "expense") return;
    setEditingTx({
      transactionId: tx.id,
      defaultValues: {
        type: tx.type,
        amountCents: Math.abs(tx.amountCents),
        accountId: tx.accountId,
        categoryId: tx.categoryName ? tx.categoryId : null,
        date: tx.date,
        description: tx.description,
      },
    });
  }, []);

  const handleTransactionCreated = useCallback(
    (data: { transactionId: string; defaultValues: { type: "income" | "expense"; amountCents: number; accountId: string; categoryId: string | null; date: string; description: string | null } }) => {
      router.refresh();
      const label = data.defaultValues.type === "expense" ? "Expense" : "Income";
      toast(`${label} created`, {
        action: {
          label: "View",
          onClick: () => setEditingTx(data),
        },
      });
    },
    [router],
  );

  const navigate = useCallback(
    (url: string) => {
      startTransition(() => {
        router.replace(url);
      });
    },
    [startTransition, router],
  );

  return (
    <>
      <FilterBar
        accounts={accounts}
        categories={categories}
        basePath={basePath}
        onNavigate={navigate}
      />
      <TransactionList
        key={`${filterHash}-${listKey}`}
        initialItems={initialItems}
        initialCursor={initialCursor}
        filters={filters}
        isPending={isPending}
        onEditTransaction={handleEdit}
      />
      <NewTransactionFab onClick={() => setFormOpen(true)} />
      <TransactionForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        accounts={accounts}
        categories={categories}
        transactionId={editingTx?.transactionId}
        defaultValues={editingTx?.defaultValues}
        onTransactionCreated={handleTransactionCreated}
      />
    </>
  );
}
