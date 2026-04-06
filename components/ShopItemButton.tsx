"use client";

interface ShopItemButtonProps {
  listItemId: number;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  checked: boolean;
  onToggle: (listItemId: number, checked: boolean, order: number) => void;
}

export default function ShopItemButton({
  listItemId,
  name,
  quantity,
  unit,
  note,
  checked,
  onToggle,
}: ShopItemButtonProps) {
  const qtyLabel = quantity !== 1 || unit ? `${quantity}${unit ? ` ${unit}` : ""}` : null;

  return (
    <button
      onClick={() => onToggle(listItemId, !checked, 0)}
      className={`flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.98] ${
        checked
          ? "bg-gray-100 opacity-60 dark:bg-gray-800"
          : "border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
      }`}
    >
      {/* Checkbox indicator */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {checked && (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <span
          className={`block text-lg font-semibold ${checked ? "text-gray-400 line-through" : ""}`}
        >
          {name}
        </span>
        {(qtyLabel || note) && (
          <span className="mt-0.5 block text-sm text-gray-400">
            {[qtyLabel, note].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    </button>
  );
}
