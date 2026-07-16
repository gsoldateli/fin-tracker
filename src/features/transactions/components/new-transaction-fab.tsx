"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01FreeIcons } from "@hugeicons/core-free-icons";

interface NewTransactionFabProps {
  onClick: () => void;
}

export function NewTransactionFab({ onClick }: NewTransactionFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-6 bottom-20 md:bottom-6 z-40 flex items-center justify-center rounded-2xl bg-primary shadow-lg active:scale-95 transition-transform w-14 h-14 md:w-auto md:h-auto md:gap-2 md:px-6 md:py-3.5"
    >
      <HugeiconsIcon
        icon={Add01FreeIcons}
        size={24}
        className="text-primary-foreground shrink-0"
      />
      <span className="hidden md:inline text-base font-semibold text-primary-foreground">
        New
      </span>
    </button>
  );
}
