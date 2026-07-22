"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransactionRow } from "@/src/features/transactions/components/transaction-row";
import { getTodayCivilDate, getYesterdayCivilDate, formatCivilDate } from "@/src/lib/date";
import type { TransactionWithRelations } from "@/src/features/transactions/queries";

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

export function RecentTransactions({
  transactions,
}: {
  transactions: TransactionWithRelations[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-2 sm:px-6">
        <CardTitle className="min-w-0 truncate text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent transactions
        </CardTitle>
        <Link
          href="/dashboard/transactions"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <p>No transactions yet</p>
            <Link
              href="/dashboard/transactions"
              className="text-primary hover:underline"
            >
              Create your first transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupByDate(transactions).entries()).map(
              ([dateLabel, groupItems]) => (
                <section key={dateLabel}>
                  <h2 className="mb-2 px-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    {dateLabel}
                  </h2>
                  <div className="space-y-2">
                    {groupItems.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} readOnly />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
