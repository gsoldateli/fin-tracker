import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/src/lib/session";
import { getDb } from "@/src/db/client";
import { transactionCategories } from "@/src/db/schema";
import { listAccountsWithBalance } from "@/src/features/accounts/queries";
import { listTransactions, type ListTransactionsOpts } from "@/src/features/transactions/queries";
import { TransactionsShell } from "@/src/features/transactions/components/transactions-shell";
import { NewTransactionFab } from "@/src/features/transactions/components/new-transaction-fab";

type SearchParams = Promise<{
  period?: string;
  type?: string;
  account?: string;
  category?: string;
  q?: string;
  from?: string;
  to?: string;
}>;

function parseSearchParams(params: Awaited<SearchParams>): ListTransactionsOpts {
  const opts: ListTransactionsOpts = {};
  const { period, type, account, category, q, from, to } = params;

  if (period === "custom") {
    if (from) opts.from = new Date(from);
    if (to) opts.to = new Date(to);
  } else if (period) {
    opts.period = period as ListTransactionsOpts["period"];
  } else {
    if (from) opts.from = new Date(from);
    if (to) opts.to = new Date(to);
  }

  if (type) opts.type = type as ListTransactionsOpts["type"];
  if (account) opts.accountId = account;
  if (category) opts.categoryId = category;
  if (q) opts.search = q;

  return opts;
}

function filterHash(params: Awaited<SearchParams>): string {
  return `${params.period ?? ""}-${params.type ?? ""}-${params.account ?? ""}-${params.category ?? ""}-${params.q ?? ""}`;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const db = getDb();
  const opts = parseSearchParams(params);
  const { items, nextCursor } = await listTransactions(db, session.userId, opts);

  const accounts = await listAccountsWithBalance(db, session.userId);
  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));

  const categories = await db
    .select({ id: transactionCategories.id, name: transactionCategories.name, type: transactionCategories.type })
    .from(transactionCategories)
    .where(eq(transactionCategories.userId, session.userId));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-primary">Transactions</h1>
      </header>

      <TransactionsShell
        filterHash={filterHash(params)}
        initialItems={items}
        initialCursor={nextCursor}
        filters={{
          period: params.period,
          type: params.type,
          account: params.account,
          category: params.category,
          q: params.q,
          from: params.from,
          to: params.to,
        }}
        accounts={accountOptions}
        categories={categories}
      />

      <NewTransactionFab />
    </div>
  );
}
