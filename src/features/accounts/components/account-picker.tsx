"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BankFreeIcons } from "@hugeicons/core-free-icons";
import { cn } from "@/src/lib/utils";
import { formatCentsToReal } from "@/src/lib/money";
import { EntityPicker } from "@/src/components/entity-picker";
import { ACCOUNT_TYPE_MAP } from "@/src/features/accounts/constants";

interface Account {
  id: string;
  name: string;
  type: string;
  balanceCents: number;
}

interface AccountPickerProps {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AccountPicker({
  accounts,
  selectedId,
  onSelect,
}: AccountPickerProps) {
  const accountTypeInfo = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((a) => [
          a.id,
          ACCOUNT_TYPE_MAP[a.type] ?? { label: a.type, icon: BankFreeIcons },
        ]),
      ),
    [accounts],
  );

  return (
    <EntityPicker
      items={accounts}
      selectedId={selectedId}
      onSelect={onSelect}
      getId={(a) => a.id}
      getSearchText={(a) => a.name}
      triggerAriaLabel="Account"
      renderTriggerContent={(item) =>
        item ? (
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon
                icon={accountTypeInfo[item.id].icon}
                size={14}
                className="text-primary"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {accountTypeInfo[item.id].label}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/60">
            Select an account
          </span>
        )
      }
      renderItem={(item) => {
        const info = accountTypeInfo[item.id];
        const neg = item.balanceCents < 0;

        return (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon
                icon={info.icon}
                size={16}
                className="text-primary"
              />
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground">{info.label}</span>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums shrink-0",
                neg ? "text-destructive" : "text-foreground",
              )}
            >
              {formatCentsToReal(item.balanceCents)}
            </span>
          </>
        );
      }}
      label="Select account"
      searchPlaceholder="Search account..."
      emptyDefault={

        'No accounts found'

      }
    />
  );
}
