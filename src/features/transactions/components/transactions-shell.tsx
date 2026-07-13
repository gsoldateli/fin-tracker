"use client";

import { useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FilterBar } from "./filter-bar";
import { TransactionList } from "./transaction-list";
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
  initialCursor: { date: number; id: string } | null;
  filters: Filters;
  filterHash: string;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  basePath?: string;
};

export function TransactionsShell({
  initialItems,
  initialCursor,
  filters,
  filterHash,
  accounts,
  categories,
  basePath = "/transactions",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        key={filterHash}
        initialItems={initialItems}
        initialCursor={initialCursor}
        filters={filters}
        isPending={isPending}
      />
    </>
  );
}
