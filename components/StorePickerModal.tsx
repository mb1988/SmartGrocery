"use client";

import { useState, useEffect, useRef } from "react";

interface Store {
  id: number;
  name: string;
  address: string | null;
}

interface StorePickerModalProps {
  onSelect: (storeId: number | null, storeName: string) => void;
  onClose: () => void;
}

export default function StorePickerModal({ onSelect, onClose }: StorePickerModalProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStoreName, setNewStoreName] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data: Store[]) => {
        setStores(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAddStore() {
    const name = newStoreName.trim();
    if (!name) return;
    setAdding(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const store: Store = await res.json();
      onSelect(store.id, store.name);
    }
    setAdding(false);
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      {/* Sheet */}
      <div
        className="safe-area-bottom w-full rounded-t-3xl bg-white p-6 pb-8 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Choose a store</h2>
          <button
            onClick={onClose}
            className="tap-target flex items-center justify-center rounded-full text-2xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-gray-400">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stores.map((store) => (
              <li key={store.id}>
                <button
                  onClick={() => onSelect(store.id, store.name)}
                  className="tap-target w-full rounded-xl border border-gray-200 px-4 text-left font-medium transition-colors active:bg-green-50 dark:border-gray-700 dark:active:bg-green-900"
                >
                  {store.name}
                  {store.address && (
                    <span className="ml-2 text-sm font-normal text-gray-400">{store.address}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new store inline */}
        <div className="mt-6 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add new store…"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
            className="flex-1 rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
          />
          <button
            onClick={handleAddStore}
            disabled={adding || !newStoreName.trim()}
            className="tap-target rounded-xl bg-green-600 px-4 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-40"
          >
            {adding ? "…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
