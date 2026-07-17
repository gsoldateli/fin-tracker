"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const PERIODS = [
  { value: "this-month", label: "This month" },
  { value: "last-90-days", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
] as const;

const TYPES = [
  { value: "", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
  { value: "transfer", label: "Transfers" },
] as const;

const chipClass = (active: boolean) =>
  active
    ? "shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    : "shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground";

type FilterState = {
  period: string;
  type: string;
  account: string;
  category: string;
  from: string;
  to: string;

};

function readFilterState(searchParams: URLSearchParams): FilterState {
  const period = searchParams.get("period") || "";
  return {
    period,
    type: searchParams.get("type") || "",
    account: searchParams.get("account") || "",
    category: searchParams.get("category") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
  };
}

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  basePath?: string;
  onNavigate?: (url: string) => void;
};

export function FilterSheet({
  open,
  onOpenChange,
  accounts,
  categories,
  basePath = "/transactions",
  onNavigate,
}: FilterSheetProps) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<FilterState>(() => readFilterState(searchParams));
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setState(readFilterState(searchParams));
  }
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const { period: localPeriod, type: localType, account: localAccount, category: localCategory } = state;

  const filteredCategories = localType
    ? categories.filter((c) => c.type === localType)
    : [];

  function applyFilters() {
    const sp = new URLSearchParams();

    sp.set("period", localPeriod);
    if (localType) sp.set("type", localType);
    if (localAccount) sp.set("account", localAccount);
    if (localCategory) sp.set("category", localCategory);

    const q = searchParams.get("q");
    if (q) sp.set("q", q);

    const url = `${basePath}?${sp.toString()}`;
    if (onNavigate) {
      onOpenChange(false);
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  }

  function clearFilters() {
    const sp = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) sp.set("q", q);
    const url = `${basePath}?${sp.toString()}`;
    if (onNavigate) {
      onOpenChange(false);
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false}>
        <div className="flex flex-col gap-6 pb-8 p-4">
          {/* Drag handle */}
          <div className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />

          {/* Period */}
          <section>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              PERIOD
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {

                    setState(prev => ({ ...prev, period: prev.period === p.value ? "" : p.value }));

                  }}
                  className={chipClass(
                    localPeriod === p.value,
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

          </section>

          {/* Type */}
          <section>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              TYPE
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setState(prev => ({ ...prev, type: prev.type === t.value ? "" : t.value }))
                  }
                  className={chipClass(localType === t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Account */}
          <section>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              ACCOUNT
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, account: "" }))}
                className={chipClass(!localAccount)}
              >
                All
              </button>
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setState(prev => ({ ...prev, account: prev.account === a.id ? "" : a.id }))
                  }
                  className={chipClass(localAccount === a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </section>

          {/* Category (only when type is selected) */}
          {filteredCategories.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                CATEGORY
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, category: "" }))}
                  className={chipClass(!localCategory)}
                >
                  All
                </button>
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setState(prev => ({ ...prev, category: prev.category === c.id ? "" : c.id }))
                    }
                    className={chipClass(localCategory === c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-lg active:scale-[0.98] transition-transform"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="w-full py-2 text-sm font-bold tracking-widest text-muted-foreground uppercase hover:text-primary transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
