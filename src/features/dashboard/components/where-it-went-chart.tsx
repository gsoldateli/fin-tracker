"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipContentProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentsToReal } from "@/src/lib/money";
import { cn } from "@/src/lib/utils";
import type { SpendingCategoryRow } from "../queries";

const PIE_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#06b6d4", "#d946ef", "#eab308", "#0ea5e9", "#a855f7",
];

type PiePayloadItem = {
  value: number;
  name: string;
  payload: SpendingCategoryRow & { fill: string };
};

const PieTooltip = ({ active, payload }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as PiePayloadItem["payload"];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm text-sm">
      <p className="font-semibold">{row.categoryName}</p>
      <p className="tabular-nums">R$ {formatCentsToReal(row.totalCents)}</p>
    </div>
  );
};

export function WhereItWentChart({
  data,
  loading,
}: {
  data: SpendingCategoryRow[];
  loading?: boolean;
}) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, d) => sum + d.totalCents, 0);

  const chartData = data.map((d, idx) => ({
    ...d,
    fill: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  return (
    <Card className={cn("transition-opacity duration-200", loading && "opacity-40")}>
      <CardHeader>
        <CardTitle>Where it went</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No expenses in this period
          </p>
        ) : (
          <div className="flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full md:w-[60%]">
              <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="totalCents"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={0}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip content={PieTooltip as any} />
              </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 pt-4">
              {chartData.map((d, idx) => {
                const percent = total > 0 ? ((d.totalCents / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.fill }}
                    />
                    <span className="truncate max-w-[120px]">{d.categoryName}</span>
                    <span className="ml-auto tabular-nums font-medium text-foreground">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
