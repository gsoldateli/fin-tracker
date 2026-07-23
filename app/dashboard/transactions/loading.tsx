import { TransactionListSkeleton } from "@/src/features/transactions/components/transaction-list-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Transactions</h1>
      </header>
      <TransactionListSkeleton />
    </div>
  );
}
