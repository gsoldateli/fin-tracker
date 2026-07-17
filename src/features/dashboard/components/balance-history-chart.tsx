"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentsToReal } from "@/src/lib/money";
import { cn } from "@/src/lib/utils";
import type { BalanceHistoryRow } from "../queries";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatBucket(bucket: string, isMonthly: boolean): string {
  const monthIdx = parseInt(bucket.slice(5, 7), 10) - 1;
  if (isMonthly) return MONTHS_SHORT[monthIdx];
  const day = parseInt(bucket.slice(8, 10), 10);
  return `${MONTHS_SHORT[monthIdx]} ${day}`;
}

function formatYAxis(cents: number): string {
  const reais = cents / 100;
  if (reais === 0) return "R$ 0";
  const abs = Math.abs(reais);
  if (abs >= 1000) return `R$${Math.round(abs / 1000)}k`;
  if (abs >= 1) return `R$${Math.round(abs)}`;
  return `R$ ${reais.toFixed(2)}`;
}

const BalanceTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;
  const balance = payload[0].value as number | undefined;
  if (balance == null) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm text-sm">
      <p className="text-muted-foreground mb-1">{label as string}</p>
      <p className="font-semibold tabular-nums">
        Balance: R$ {formatCentsToReal(balance)}
      </p>
    </div>
  );
};

export function BalanceHistoryChart({
  data,
  granularity,
  loading,
}: {
  data: BalanceHistoryRow[];
  granularity: "day" | "month";
  loading?: boolean;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatBucket(d.date, granularity === "month"),
  }));

  const allZero = chartData.every((d) => d.balanceCents === 0);

  return (
    <Card className={cn("transition-opacity duration-200", loading && "opacity-40")}>
      <CardHeader>
        <CardTitle>Balance over time</CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No transactions in this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ReferenceLine y={0} stroke="#d1d5db" />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip content={BalanceTooltip as any} />
              <Area
                type="monotone"
                dataKey="balanceCents"
                stroke="hsl(var(--chart-3))"
                strokeWidth={3}
              // fill="url(#balanceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
