"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionRow } from "./transaction-row";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { loadMoreTransactions } from "../actions";
import type { TransactionWithRelations } from "../queries";
import { cn } from "@/src/lib/utils";

type Filters = {
  period?: string;
  type?: string;
  account?: string;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
};

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "TODAY";
  if (target.getTime() === yesterday.getTime()) return "YESTERDAY";
  return target
    .toLocaleDateString("en-US", { day: "2-digit", month: "long" })
    .toUpperCase();
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
}: {
  initialItems: TransactionWithRelations[];
  initialCursor: { date: number; id: string } | null;
  filters: Filters;
  isPending?: boolean;
}) {
  const [items, setItems] = useState<TransactionWithRelations[]>(initialItems);
  const [cursor, setCursor] = useState<{ date: number; id: string } | null>(
    initialCursor,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const result = await loadMoreTransactions(filters, cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, filters, isLoadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, isLoadingMore, loadMore]);

  const isEmpty = items.length === 0;
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
              {/* "Clear filters" link would go here */}
            </>
          ) : (
            <p>No transactions yet</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {Array.from(groupByDate(items).entries()).map(
            ([dateLabel, groupItems]) => (
              <section key={dateLabel}>
                <h2 className="mb-4 px-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  {dateLabel}
                </h2>
                <div className="space-y-4">
                  {groupItems.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      {!isEmpty && isLoadingMore && (
        <div className="mt-4">
          <TransactionListSkeleton rows={2} />
        </div>
      )}

      <div ref={sentinelRef} className="h-px" />

      {cursor && (
        <div className="flex justify-center py-6">
          <button
            type="button"
            onClick={loadMore}
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
