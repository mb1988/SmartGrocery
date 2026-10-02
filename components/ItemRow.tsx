"use client";

import { formatQuantity } from "@/lib/parseItem";
import ItemThumb from "./ItemThumb";
import { CloseIcon } from "./icons";

interface ItemRowProps {
  listItemId: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unit: string | null;
  note: string | null;
  checked: boolean;
  readOnly?: boolean;
  onEdit?: (listItemId: number) => void;
  onDelete?: (listItemId: number) => void;
}

export default function ItemRow({
  listItemId,
  name,
  category,
  imageUrl,
  quantity,
  unit,
  note,
  checked,
  readOnly,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const qtyLabel = formatQuantity(quantity, unit);
  const editable = !readOnly && !!onEdit;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white py-2 pl-3 pr-1 dark:border-gray-800 dark:bg-gray-900">
      <ItemThumb imageUrl={imageUrl} category={category} />

      <button
        type="button"
        disabled={!editable}
        onClick={() => onEdit?.(listItemId)}
        className="min-w-0 flex-1 py-1 text-left disabled:cursor-default"
        aria-label={editable ? `Edit ${name}` : undefined}
      >
        <span
          className={`capitalize-first block truncate font-medium ${
            checked ? "text-gray-400 line-through" : ""
          }`}
        >
          {name}
        </span>
        {(qtyLabel || note) && (
          <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
            {qtyLabel && (
              <span className="font-medium text-green-700 dark:text-green-400">{qtyLabel}</span>
            )}
            {qtyLabel && note && " · "}
            {note && <span className="italic">{note}</span>}
          </span>
        )}
      </button>

      {!readOnly && onDelete && (
        <button
          onClick={() => onDelete(listItemId)}
          className="tap-target flex items-center justify-center rounded-full text-gray-300 transition-colors hover:text-red-500 active:text-red-500 dark:text-gray-600"
          aria-label={`Remove ${name}`}
        >
          <CloseIcon className="h-[18px] w-[18px]" />
        </button>
      )}
    </li>
  );
}
