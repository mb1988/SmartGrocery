"use client";

import { useState, useEffect, useRef } from "react";

interface Item {
  id: number;
  name: string;
  category: string | null;
}

interface AddItemBarProps {
  listId: number;
  onAdded: () => void;
}

export default function AddItemBar({ listId, onAdded }: AddItemBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/items?search=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data: Item[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function addItem(name: string) {
    setAdding(true);
    setOpen(false);
    setQuery("");
    await fetch("/api/list-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, itemName: name }),
    });
    setAdding(false);
    onAdded();
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add an item…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              addItem(query.trim().toLowerCase());
            }
          }}
          className="flex-1 rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
          autoComplete="off"
        />
        <button
          onClick={() => query.trim() && addItem(query.trim().toLowerCase())}
          disabled={adding || !query.trim()}
          className="tap-target rounded-xl bg-green-600 px-4 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-40"
        >
          {adding ? "…" : "Add"}
        </button>
      </div>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                onMouseDown={() => addItem(item.name)}
                className="tap-target w-full px-4 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900"
              >
                {item.name}
                {item.category && (
                  <span className="ml-2 text-xs text-gray-400">{item.category}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
