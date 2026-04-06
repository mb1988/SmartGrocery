"use client";

import { useState } from "react";

interface ItemRowProps {
  listItemId: number;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  checked: boolean;
  onDelete: (listItemId: number) => void;
  onUpdate?: (listItemId: number, quantity: number, unit: string | null) => void;
}

export default function ItemRow({
  listItemId,
  name,
  quantity,
  unit,
  note,
  checked,
  onDelete,
  onUpdate,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [qtyInput, setQtyInput] = useState(String(quantity));
  const [unitInput, setUnitInput] = useState(unit ?? "");

  const qtyLabel = quantity !== 1 || unit ? `${quantity}${unit ? ` ${unit}` : ""}` : null;

  function startEdit() {
    if (checked) return;
    setQtyInput(String(quantity));
    setUnitInput(unit ?? "");
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const newQty = Math.max(1, parseInt(qtyInput, 10) || 1);
    const newUnit = unitInput.trim() || null;
    if (newQty === quantity && newUnit === unit) return;
    onUpdate?.(listItemId, newQty, newUnit);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="min-w-0 flex-1">
        <span className={`block font-medium ${checked ? "text-gray-400 line-through" : ""}`}>
          {name}
        </span>

        {editing ? (
          <div className="mt-1 flex items-center gap-1">
            <input
              autoFocus
              type="number"
              min={1}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              className="w-14 rounded-lg border border-green-400 bg-transparent px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="unit"
              value={unitInput}
              onChange={(e) => setUnitInput(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              className="w-20 rounded-lg border border-green-400 bg-transparent px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ) : (
          (qtyLabel || note) && (
            <span
              className={`text-xs text-gray-400 ${!checked && onUpdate ? "cursor-pointer underline-offset-2 hover:underline" : ""}`}
              onClick={startEdit}
              title={!checked && onUpdate ? "Tap to edit" : undefined}
            >
              {[qtyLabel, note].filter(Boolean).join(" · ")}
            </span>
          )
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
