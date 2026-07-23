"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01FreeIcons, FilterFreeIcons } from "@hugeicons/core-free-icons";
import { FilterSheet } from "./filter-sheet";

const TYPES = [
  { value: "", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
  { value: "transfer", label: "Transfers" },
] as const;

type FilterBarProps = {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  basePath?: string;
  onNavigate?: (url: string) => void;
};

export function FilterBar({
  accounts,
  categories,
  basePath = "/dashboard/transactions",
  onNavigate,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") || "";
  const account = searchParams.get("account") || "";
  const category = searchParams.get("category") || "";
  const q = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount = [
    searchParams.get("period"),
    type,
    account,
    category,
    q,
  ].filter(Boolean).length;

  const filteredCategories = type
    ? categories.filter((c) => c.type === type)
    : [];

  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value) sp.set(key, value);
        else sp.delete(key);
      }
      const url = `${basePath}?${sp.toString()}`;
      if (onNavigate) onNavigate(url);
      else router.replace(url);
    },
    [onNavigate, router, searchParams, basePath],
  );

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateURL({ q: value || "" });
    }, 300);
  }

  const chipClass = (active: boolean) =>
    active
      ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
      : "rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80";

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <HugeiconsIcon
          icon={Search01FreeIcons}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search transactions..."
          aria-label="Search transactions"
          className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Desktop filters */}
      <div className="hidden md:block space-y-3">
        {/* Type */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() =>
                updateURL({ type: type === t.value ? "" : t.value })
              }
              className={chipClass(type === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Account + Category */}
        <div className="flex flex-wrap gap-3">
          <select
            value={account}
            onChange={(e) => updateURL({ account: e.target.value })}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {filteredCategories.length > 0 && (
            <select
              value={category}
              onChange={(e) => updateURL({ category: e.target.value })}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="">All categories</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mobile filter trigger */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground"
        >
          <HugeiconsIcon
            icon={FilterFreeIcons}
            className="h-4 w-4"
            size={16}
          />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {activeFilterCount}
            </span>
          )}
        </button>

        <FilterSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          accounts={accounts}
          categories={categories}
          basePath={basePath}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
