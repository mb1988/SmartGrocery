"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import ItemThumb from "./ItemThumb";
import { getCategory } from "@/lib/categories";

export interface EditableItem {
  listItemId: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unit: string | null;
  note: string | null;
}

interface ItemEditSheetProps {
  item: EditableItem;
  onSave: (changes: { quantity: number; unit: string | null; note: string | null }) => void;
  onDelete: () => void;
  onClose: () => void;
}

const UNIT_CHIPS = ["g", "kg", "ml", "l", "pack", "tin", "bottle"];
const NOTE_CHIPS = ["own brand", "large", "organic", "ripe", "on offer", "gluten free"];

export default function ItemEditSheet({ item, onSave, onDelete, onClose }: ItemEditSheetProps) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit ?? "");
  const [note, setNote] = useState(item.note ?? "");

  const parsedQty = parseFloat(quantity.replace(",", "."));
  const validQty = Number.isFinite(parsedQty) && parsedQty > 0;
  // Weighed units step in bigger increments
  const step = unit === "g" || unit === "ml" ? 100 : 1;

  function bump(delta: number) {
    const current = validQty ? parsedQty : 1;
    // Never step below the smallest sensible amount (keeps a typed 0.5 kg reachable)
    const floor = step === 1 ? Math.min(1, current) : step;
    const next = Math.max(floor, Math.round((current + delta) * 100) / 100);
    setQuantity(String(next));
  }

  function save() {
    if (!validQty) return;
    onSave({
      quantity: Math.round(parsedQty * 100) / 100,
      unit: unit.trim() || null,
      note: note.trim() || null,
    });
  }

  return (
    <Sheet onClose={onClose} title="Edit item">
      <div className="mb-5 flex items-center gap-3">
        <ItemThumb imageUrl={item.imageUrl} category={item.category} size="md" />
        <div className="min-w-0">
          <p className="capitalize-first truncate text-lg font-semibold">{item.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getCategory(item.category).label}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bump(-step)}
              aria-label="Decrease quantity"
              className="tap-target rounded-xl border border-gray-200 text-xl font-semibold dark:border-gray-700"
            >
              −
            </button>
            <input
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-label="Quantity"
              className={`w-20 rounded-xl border bg-transparent py-3 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 ${
                validQty ? "border-gray-200 dark:border-gray-700" : "border-red-400"
              }`}
            />
            <button
              type="button"
              onClick={() => bump(step)}
              aria-label="Increase quantity"
              className="tap-target rounded-xl border border-gray-200 text-xl font-semibold dark:border-gray-700"
            >
              +
            </button>
            <input
              value={unit}
              maxLength={20}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="unit"
              aria-label="Unit"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-transparent px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
            />
          </div>
          <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1">
            {UNIT_CHIPS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(unit === u ? "" : u)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                  unit === u
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="item-note"
            className="mb-1.5 block text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            Note
          </label>
          <input
            id="item-note"
            value={note}
            maxLength={120}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. ripe ones, own brand"
            className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
          />
          <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1">
            {NOTE_CHIPS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(note === n ? "" : n)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                  note === n
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pb-2">
          <button
            type="submit"
            disabled={!validQty}
            className="tap-target w-full rounded-2xl bg-green-600 text-base font-bold text-white active:bg-green-700 disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="tap-target w-full rounded-2xl text-base font-semibold text-red-600 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950"
          >
            Remove from list
          </button>
        </div>
      </form>
    </Sheet>
  );
}
