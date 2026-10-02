"use client";

import { getCategory } from "@/lib/categories";
import { relativeDays } from "@/lib/client";
import { PlusIcon } from "./icons";

export interface Suggestion {
  itemId: number;
  name: string;
  category: string | null;
  timesBought: number;
  daysSinceLast: number;
  due: boolean;
}

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onAdd: (suggestion: Suggestion) => void;
}

/** "Your usuals" — one-tap add for items the user regularly buys. */
export default function SuggestionChips({ suggestions, onAdd }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <section className="mb-4">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Your usuals
      </h2>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {suggestions.map((s) => (
          <li key={s.itemId} className="shrink-0">
            <button
              onClick={() => onAdd(s)}
              aria-label={`Add ${s.name}`}
              title={`Bought ${s.timesBought}× · last ${relativeDays(s.daysSinceLast)}`}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-3 text-sm font-medium transition-colors active:scale-95 ${
                s.due
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <span aria-hidden="true">{getCategory(s.category).emoji}</span>
              <span>{s.name}</span>
              {s.due && (
                <span className="text-xs font-normal opacity-75">
                  · {relativeDays(s.daysSinceLast)}
                </span>
              )}
              <PlusIcon className="h-3.5 w-3.5 opacity-50" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
