"use client";

import { useState, useEffect } from "react";
import Sheet from "./Sheet";
import { api } from "@/lib/client";

interface Store {
  id: number;
  name: string;
  address: string | null;
  learnedCount?: number;
}

interface StorePickerModalProps {
  onSelect: (storeId: number | null, listName: string | null) => void;
  onClose: () => void;
  title?: string;
  defaultName?: string;
}

export default function StorePickerModal({
  onSelect,
  onClose,
  title = "New list",
  defaultName = "",
}: StorePickerModalProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [listName, setListName] = useState(defaultName);
  const [newStoreName, setNewStoreName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    api<Store[]>("/api/stores")
      .then((data) => setStores(Array.isArray(data) ? data : []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  const name = listName.trim() || null;

  async function handleAddStore() {
    const storeName = newStoreName.trim();
    if (!storeName) return;
    setAdding(true);
    setAddError(null);
    try {
      const store = await api<Store>("/api/stores", {
        method: "POST",
        body: { name: storeName },
      });
      onSelect(store.id, name);
    } catch {
      setAddError("Couldn't add store — please try again");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
        Name <span className="font-normal">(optional)</span>
      </label>
      <input
        type="text"
        placeholder="e.g. Weekly shop"
        value={listName}
        maxLength={80}
        onChange={(e) => setListName(e.target.value)}
        className="mb-5 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
      />

      <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        Where are you shopping?
      </p>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        stores.length > 0 && (
          <ul className="space-y-2">
            {stores.map((store) => (
              <li key={store.id}>
                <button
                  onClick={() => onSelect(store.id, name)}
                  className="tap-target flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 text-left font-medium transition-colors hover:border-green-400 active:bg-green-50 dark:border-gray-700 dark:active:bg-green-950"
                >
                  <span className="truncate">
                    {store.name}
                    {store.address && (
                      <span className="ml-2 text-sm font-normal text-gray-400">
                        {store.address}
                      </span>
                    )}
                  </span>
                  {!!store.learnedCount && (
                    <span className="shrink-0 text-xs font-normal text-green-600 dark:text-green-400">
                      {store.learnedCount} items learned
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Add new store inline */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder={stores.length ? "Or add a new store…" : "Add your first store, e.g. Tesco"}
          value={newStoreName}
          maxLength={60}
          onChange={(e) => setNewStoreName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
        />
        <button
          onClick={handleAddStore}
          disabled={adding || !newStoreName.trim()}
          className="tap-target rounded-xl bg-green-600 px-4 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-40"
        >
          {adding ? "…" : "Add"}
        </button>
      </div>
      {addError && <p className="mt-2 text-sm text-red-500">{addError}</p>}

      <button
        onClick={() => onSelect(null, name)}
        className="tap-target mb-2 mt-3 w-full text-sm text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
      >
        Skip — no store (route won&apos;t be learned)
      </button>
    </Sheet>
  );
}
