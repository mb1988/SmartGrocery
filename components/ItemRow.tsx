"use client";

interface ItemRowProps {
  listItemId: number;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  checked: boolean;
  onDelete: (listItemId: number) => void;
}

export default function ItemRow({
  listItemId,
  name,
  quantity,
  unit,
  note,
  checked,
  onDelete,
}: ItemRowProps) {
  const qtyLabel = quantity !== 1 || unit ? `${quantity}${unit ? ` ${unit}` : ""}` : null;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="min-w-0 flex-1">
        <span className={`block font-medium ${checked ? "text-gray-400 line-through" : ""}`}>
          {name}
        </span>
        {(qtyLabel || note) && (
          <span className="text-xs text-gray-400">
            {[qtyLabel, note].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(listItemId)}
        className="tap-target flex items-center justify-center rounded-full text-xl leading-none text-gray-300 transition-colors hover:text-red-400"
        aria-label={`Remove ${name}`}
      >
        ×
      </button>
    </li>
  );
}
