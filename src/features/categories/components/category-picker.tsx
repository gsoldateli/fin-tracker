"use client";

import { useState, useMemo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01FreeIcons } from "@hugeicons/core-free-icons";
import { cn } from "@/src/lib/utils";
import { EntityPicker } from "@/src/components/entity-picker";
import { createCategoryAction } from "../actions";

const CATEGORY_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-orange-100", text: "text-orange-800" },
  { bg: "bg-pink-200", text: "text-pink-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-indigo-100", text: "text-indigo-800" },
  { bg: "bg-rose-200", text: "text-rose-800" },
];

function getCategoryColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  type: "income" | "expense";
  onCategoryCreated?: (category: Category) => void;
}

export function CategoryPicker({
  categories: initialCategories,
  selectedId,
  onSelect,
  type,
  onCategoryCreated,
}: CategoryPickerProps) {
  const [addedCategories, setAddedCategories] = useState<Category[]>([]);

  const allCategories = useMemo(() => {
    const ids = new Set(initialCategories.map((c) => c.id));
    const missing = addedCategories.filter((c) => !ids.has(c.id));
    return [...initialCategories, ...missing];
  }, [initialCategories, addedCategories]);

  const items = useMemo(
    () => allCategories.filter((c) => c.type === type),
    [allCategories, type],
  );

  const handleCreate = useCallback(
    async (name: string) => {
      const result = await createCategoryAction(name, type);
      if (!result.ok) throw new Error(result.error);

      if (result.created) {
        setAddedCategories((prev) => {
          if (prev.some((c) => c.id === result.category.id)) return prev;
          return [...prev, result.category];
        });
        onCategoryCreated?.(result.category);
      }

      return result.category;
    },
    [type, onCategoryCreated],
  );

  return (
    <EntityPicker
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      getId={(c) => c.id}
      getSearchText={(c) => c.name}
      triggerAriaLabel="Category"
      renderTriggerContent={(item) =>
        item ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                getCategoryColor(item.name).bg,
                getCategoryColor(item.name).text,
              )}
            >
              {getInitial(item.name)}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/60">
            Select a category
          </span>
        )
      }
      renderItem={(item, isSelected) => (
        <>
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              getCategoryColor(item.name).bg,
              getCategoryColor(item.name).text,
            )}
          >
            {getInitial(item.name)}
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">
            {item.name}
          </span>
          {isSelected && (
            <HugeiconsIcon
              icon={Tick01FreeIcons}
              size={16}
              className="shrink-0 text-primary"
            />
          )}
        </>
      )}
      label="Select category"
      searchPlaceholder="Search category..."
      emptySearchMessage={(term) => (
        <p className="text-center text-sm text-muted-foreground">
          You don&apos;t have a category &ldquo;{term}&rdquo; yet
        </p>
      )}
      emptyDefault={<>No categories found</>}
      creatable={{
        createLabel: "New category",
        createPlaceholder: "Category name",
        createAriaLabel: "New category name",
        createButtonLabel: "Create",
        onCreate: handleCreate,
        getCreateButtonForTerm: (term) => `+ Create "${term}"`,
      }}
    />
  );
}
