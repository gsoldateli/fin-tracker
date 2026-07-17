import {
  BankFreeIcons,
  Cash01FreeIcons,
  PiggyBankFreeIcons,
  CreditCardFreeIcons,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const ACCOUNT_TYPE_MAP: Record<string, { label: string; icon: IconSvgElement }> = {
  checking: { label: "Checking", icon: BankFreeIcons },
  savings: { label: "Savings", icon: PiggyBankFreeIcons },
  cash: { label: "Cash", icon: Cash01FreeIcons },
  credit: { label: "Credit", icon: CreditCardFreeIcons },
};

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_MAP).map(
  ([value, { label, icon }]) => ({ value, label, icon }),
);
