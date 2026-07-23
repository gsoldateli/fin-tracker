"use client";

import { useState } from "react";
import { TransactionRow } from "./transaction-row";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { loadMoreTransactions } from "../actions";
import type { TransactionWithRelations } from "../queries";
import { cn } from "@/src/lib/utils";
import { getTodayCivilDate, getYesterdayCivilDate, formatCivilDate } from "@/src/lib/date";

type Filters = {
  period?: string;
  type?: string;
  account?: string;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
};

function getDateLabel(dateStr: string): string {
  const today = getTodayCivilDate();
  if (dateStr === today) return "TODAY";
  if (dateStr === getYesterdayCivilDate()) return "YESTERDAY";
  return formatCivilDate(dateStr);
}

function groupByDate(
  items: TransactionWithRelations[],
): Map<string, TransactionWithRelations[]> {
  const groups = new Map<string, TransactionWithRelations[]>();
  for (const item of items) {
    const key = getDateLabel(item.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

export function TransactionList({
  initialItems,
  initialCursor,
  filters,
  isPending,
  onEditTransaction,
}: {
  initialItems: TransactionWithRelations[];
  initialCursor: { date: string; createdAt: number; id: string } | null;
  filters: Filters;
  isPending?: boolean;
  onEditTransaction?: (tx: TransactionWithRelations) => void;
}) {
  const [loadedItems, setLoadedItems] = useState<TransactionWithRelations[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const allItems = [...initialItems, ...loadedItems];

  async function handleLoadMore() {
    if (!cursor) return;
    setIsLoadingMore(true);
    try {
      const result = await loadMoreTransactions(filters, cursor);
      setLoadedItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const isEmpty = allItems.length === 0;
  const hasFilters = !!(
    filters.period ||
    filters.type ||
    filters.account ||
    filters.category ||
    filters.q
  );

  return (
    <div className={cn("transition-opacity duration-200", isPending && "opacity-50 pointer-events-none")}>
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          {hasFilters ? (
            <>
              <p>No transactions found</p>
            </>
          ) : (
            <p>No transactions yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {Array.from(groupByDate(allItems).entries()).map(
            ([dateLabel, groupItems]) => (
              <section key={dateLabel}>
                <h2 className="mb-4 px-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  {dateLabel}
                </h2>
                <div className="space-y-4">
                  {groupItems.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} onEdit={onEditTransaction} />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      {isLoadingMore && (
        <div className="mt-4">
          <TransactionListSkeleton rows={2} />
        </div>
      )}

      {cursor && !isEmpty && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-full border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {!cursor && !isEmpty && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No more transactions
        </p>
      )}
    </div>
  );
}
