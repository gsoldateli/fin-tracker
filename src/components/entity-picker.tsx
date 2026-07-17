"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useId,
  type ReactNode,
} from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowDown01FreeIcons,
  Add01FreeIcons,
} from "@hugeicons/core-free-icons";
import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

export interface EntityPickerProps<T> {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;

  getId: (item: T) => string;
  getSearchText: (item: T) => string;

  triggerAriaLabel: string;
  renderTriggerContent: (item: T | undefined) => ReactNode;

  renderItem: (item: T, isSelected?: boolean) => ReactNode;

  label: string;
  searchPlaceholder: string;

  emptySearchMessage?: (term: string) => ReactNode;
  emptyDefault?: ReactNode;

  creatable?: {
    createLabel: ReactNode;
    createPlaceholder: string;
    createAriaLabel: string;
    createButtonLabel: string;
    onCreate: (name: string) => Promise<T>;
    getCreateButtonForTerm: (term: string) => string;
  };
}

export function EntityPicker<T>({
  items,
  selectedId,
  onSelect,
  getId,
  getSearchText,
  triggerAriaLabel,
  renderTriggerContent,
  renderItem,
  label,
  searchPlaceholder,
  emptySearchMessage,
  emptyDefault,
  creatable,
}: EntityPickerProps<T>) {
  const [view, setView] = useState<"trigger" | "picker">("trigger");
  const [search, setSearch] = useState("");
  const [creatingInline, setCreatingInline] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(
    () => items.find((a) => getId(a) === selectedId),
    [items, selectedId, getId],
  );

  useEffect(() => {
    if (view === "picker") {
      const id = setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>("[cmdk-input]");
        el?.focus();
      }, 100);
      return () => clearTimeout(id);
    }
  }, [view]);

  useEffect(() => {
    if (creatingInline) {
      const id = setTimeout(() => inlineInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [creatingInline]);

  useEffect(() => {
    if (view === "trigger") {
      triggerRef.current?.focus();
    }
  }, [view]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!search) return true;
      return getSearchText(item).toLowerCase().includes(search.toLowerCase());
    });
  }, [items, search, getSearchText]);

  const hasResults = filteredItems.length > 0;

  const handleResetSearch = useCallback(() => {
    setSearch("");
    setCreatingInline(false);
    if (!creatable) return;
    setNewItemName("");
    setCreateError(null);
  }, [creatable]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setView("trigger");
      handleResetSearch();
    },
    [onSelect, handleResetSearch],
  );

  const handleCreate = useCallback(
    async (name: string) => {
      if (!name || !creatable) return;
      setIsCreating(true);
      setCreateError(null);

      try {
        const item = await creatable.onCreate(name);
        onSelect(getId(item));
        setView("trigger");
        handleResetSearch();
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : "Failed to create");
      } finally {
        setIsCreating(false);
      }
    },
    [creatable, getId, onSelect, handleResetSearch],
  );

  const handleBack = useCallback(() => {
    setView("trigger");
    handleResetSearch();
  }, [handleResetSearch]);

  const handleOpenPicker = useCallback(() => {
    handleResetSearch();
    setView("picker");
  }, [handleResetSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      }
    },
    [handleBack],
  );

  if (view === "trigger") {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpenPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenPicker();
          }
        }}
        role="combobox"
        aria-expanded={false}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={triggerAriaLabel}
        className="flex h-12 w-full min-h-[44px] items-center justify-between rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition-all focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary hover:border-primary/40"
      >
        {renderTriggerContent(selectedItem)}
        <HugeiconsIcon
          icon={ArrowDown01FreeIcons}
          size={16}
          className="shrink-0 text-muted-foreground"
        />
      </button>
    );
  }

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col bg-background rounded-2xl"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label={label}
    >
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
      </div>

      <div className="flex shrink-0 items-center gap-2 px-6 pt-2 pb-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to form"
          className="flex items-center gap-1 text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} size={18} />
          <span className="text-sm font-semibold">Back</span>
        </button>
        <h2 className="flex-1 text-center text-base font-semibold text-foreground">
          {label}
        </h2>
        <div className="w-[52px]" />
      </div>

      <div className="min-h-0 flex-1 flex flex-col px-6 pb-6">
        <Command
          shouldFilter={false}
          className="flex-1 flex flex-col overflow-hidden p-0"
        >
          <div className="shrink-0 pb-4">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              aria-label={searchPlaceholder}
            />
          </div>

          <CommandList id={listboxId} className="max-h-none flex-1 overflow-y-auto">
            {hasResults ? (
              filteredItems.map((item) => {
                const id = getId(item);
                const isSelected = id === selectedId;

                return (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => handleSelect(id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3.5 min-h-[44px]",
                      isSelected && "bg-primary/10",
                    )}
                  >
                    {renderItem(item, isSelected)}
                  </CommandItem>
                );
              })
            ) : (
              <CommandEmpty>
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center gap-4 py-8"
                >
                  {search && emptySearchMessage ? (
                    emptySearchMessage(search)
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      {emptyDefault ?? "No results found"}
                    </p>
                  )}
                  {search && creatable && (
                    <Button
                      type="button"
                      onClick={() => handleCreate(search)}
                      disabled={isCreating}
                      className="h-12 rounded-full px-6 text-sm font-semibold"
                    >
                      {isCreating
                        ? "Creating..."
                        : creatable.getCreateButtonForTerm(search)}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>

        {creatable && hasResults && !creatingInline && (
          <button
            type="button"
            onClick={() => setCreatingInline(true)}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 px-3 py-3.5 text-left transition-all hover:border-muted-foreground/40 min-h-[44px] shrink-0 mt-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Add01FreeIcons} size={14} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {creatable.createLabel}
            </span>
          </button>
        )}

        {creatable && hasResults && creatingInline && (
          <div className="flex flex-col gap-2 pt-2 shrink-0">
            <input
              ref={inlineInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate(newItemName.trim());
                }
              }}
              placeholder={creatable.createPlaceholder}
              aria-label={creatable.createAriaLabel}
              className="h-12 w-full min-h-[44px] rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {createError && (
              <p className="text-sm text-destructive" role="alert">
                {createError}
              </p>
            )}
            <Button
              type="button"
              onClick={() => handleCreate(newItemName.trim())}
              disabled={!newItemName.trim() || isCreating}
              className="h-12 w-full rounded-xl text-sm font-semibold"
            >
              {isCreating ? "Creating..." : creatable.createButtonLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
