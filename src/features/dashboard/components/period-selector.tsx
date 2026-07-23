"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01FreeIcons } from "@hugeicons/core-free-icons";
import { cn } from "@/src/lib/utils";
import { PRESETS, type Period } from "../schemas";

const PRESET_LABELS: Record<Period, string> = {
  "last-90-days": "Last 90 days",
  "this-month": "This month",
  ytd: "YTD",
};

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon
        icon={Calendar01FreeIcons}
        size={18}
        className="shrink-0 text-muted-foreground"
      />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "rounded-full px-3.5 py-2.5 text-xs font-medium transition-all",
              value === v
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground",
            )}
          >
            {PRESET_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
