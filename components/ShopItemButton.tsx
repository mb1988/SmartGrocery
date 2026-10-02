"use client";

import { formatQuantity } from "@/lib/parseItem";
import ItemThumb from "./ItemThumb";
import { CheckIcon } from "./icons";

interface ShopItemButtonProps {
  listItemId: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unit: string | null;
  note: string | null;
  checked: boolean;
  onToggle: (listItemId: number, checked: boolean) => void;
}

export default function ShopItemButton({
  listItemId,
  name,
  category,
  imageUrl,
  quantity,
  unit,
  note,
  checked,
  onToggle,
}: ShopItemButtonProps) {
  const qtyLabel = formatQuantity(quantity, unit);

  return (
    <button
      onClick={() => onToggle(listItemId, !checked)}
      aria-pressed={checked}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 text-left transition-all duration-200 active:scale-[0.98] ${
        checked
          ? "bg-gray-100/80 py-2.5 dark:bg-gray-900/60"
          : "min-h-[72px] border border-gray-200 bg-white py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      {/* Checkbox indicator */}
      <span
        key={String(checked)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked
            ? "animate-pop border-green-500 bg-green-500 text-white"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>

      {!checked && <ItemThumb imageUrl={imageUrl} category={category} size="md" />}

      <div className="min-w-0 flex-1">
        <span
          className={`capitalize-first block truncate ${
            checked ? "text-base text-gray-400 line-through" : "text-lg font-semibold"
          }`}
        >
          {name}
        </span>
        {!checked && note && (
          <span className="mt-0.5 block truncate text-sm font-medium text-amber-700 dark:text-amber-400">
            {note}
          </span>
        )}
      </div>

      {qtyLabel && (
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-sm font-bold ${
            checked
              ? "text-gray-400"
              : "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300"
          }`}
        >
          {qtyLabel}
        </span>
      )}
    </button>
  );
}
