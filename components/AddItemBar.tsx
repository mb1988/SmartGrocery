"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { ItemSearchResult } from "@/app/api/items/route";

const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), { ssr: false });

interface AddItemBarProps {
  listId: number;
  onAdded: () => void;
}

export default function AddItemBar({ listId, onAdded }: AddItemBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ItemSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
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
        const data: ItemSearchResult[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function addItem(input: ItemSearchResult | string) {
    const name = typeof input === "string" ? input.trim().toLowerCase() : input.name;
    const extra =
      typeof input === "string"
        ? {}
        : {
            barcode: input.barcode ?? undefined,
            imageUrl: input.imageUrl ?? undefined,
            category: input.category ?? undefined,
          };

    setAdding(true);
    setOpen(false);
    setQuery("");
    await fetch("/api/list-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, itemName: name, ...extra }),
    });
    setAdding(false);
    onAdded();
    inputRef.current?.focus();
  }

  async function handleBarcodeDetected(barcode: string) {
    setScanning(false);
    setScanError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        setScanError("Product not found. Type the name manually.");
        setAdding(false);
        return;
      }
      const product: ItemSearchResult = await res.json();
      await addItem(product);
    } catch {
      setScanError("Lookup failed. Please try again.");
      setAdding(false);
    }
  }

  return (
    <div className="relative">
      {scanning && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add an item…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              addItem(query.trim());
            }
          }}
          className="flex-1 rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
          autoComplete="off"
        />
        {/* Barcode scan button */}
        <button
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
          disabled={adding}
          aria-label="Scan barcode"
          className="tap-target rounded-xl border border-gray-200 px-3 text-xl disabled:opacity-40 dark:border-gray-700"
        >
          📷
        </button>
        <button
          onClick={() => query.trim() && addItem(query.trim())}
          disabled={adding || !query.trim()}
          className="tap-target rounded-xl bg-green-600 px-4 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-40"
        >
          {adding ? "…" : "Add"}
        </button>
      </div>

      {scanError && <p className="mt-1 text-xs text-red-500">{scanError}</p>}

      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {suggestions.map((item, i) => (
            <li key={item.barcode ?? item.id ?? `off-${i}`}>
              <button
                onMouseDown={() => addItem(item)}
                className="tap-target flex w-full items-center gap-3 px-4 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 flex-shrink-0 rounded object-contain"
                  />
                ) : (
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-lg dark:bg-gray-800">
                    🛒
                  </span>
                )}
                <span className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-400">
                    {[item.brand, item.category].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
