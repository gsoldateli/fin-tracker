"use client";

import { useState, useTransition, useCallback } from "react";
import { getDashboardCharts } from "../actions";
import { PeriodSelector } from "./period-selector";
import { BalanceHistoryChart } from "./balance-history-chart";
import { WhereItWentChart } from "./where-it-went-chart";
import type { Period } from "../schemas";
import type { BalanceHistoryRow, SpendingCategoryRow } from "../queries";

const GRANULARITY: Record<Period, "day" | "month"> = {
  "last-90-days": "month",
  "this-month": "day",
  ytd: "month",
};

type ChartData = {
  balanceHistory: BalanceHistoryRow[];
  spendingByCategory: SpendingCategoryRow[];
};

export function ChartsSection({ initialData }: { initialData: ChartData }) {
  const [period, setPeriod] = useState<Period>("last-90-days");
  const [data, setData] = useState<ChartData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = useCallback(
    (newPeriod: Period) => {
      setPeriod(newPeriod);
      startTransition(async () => {
        const result = await getDashboardCharts(newPeriod);
        setData(result);
      });
    },
    [],
  );

  return (
    <section className="space-y-4">
      <PeriodSelector value={period} onChange={handlePeriodChange} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BalanceHistoryChart
          data={data.balanceHistory}
          granularity={GRANULARITY[period]}
          loading={isPending}
        />
        <WhereItWentChart
          data={data.spendingByCategory}
          loading={isPending}
        />
      </div>
    </section>
  );
}
