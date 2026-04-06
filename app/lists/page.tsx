"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ListCard from "@/components/ListCard";
import StorePickerModal from "@/components/StorePickerModal";

interface ListSummary {
  id: number;
  name: string | null;
  storeId: number | null;
  storeName: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchLists = useCallback(async () => {
    const res = await fetch("/api/lists");
    if (res.ok) {
      const data: ListSummary[] = await res.json();
      setLists(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this list?")) return;
    const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
    if (res.ok) setLists((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleStoreSelect(storeId: number | null) {
    setShowPicker(false);
    setCreating(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    if (res.ok) {
      const list = await res.json();
      router.push(`/lists/${list.id}`);
    }
    setCreating(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-bold tracking-tight">SmartGrocery</h1>
        <button
          onClick={() => setShowPicker(true)}
          disabled={creating}
          className="tap-target rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition-colors active:bg-green-700 disabled:opacity-50"
        >
          {creating ? "Creating…" : "+ New List"}
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : lists.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <span className="text-5xl">🛒</span>
            <h2 className="text-xl font-bold">No lists yet</h2>
            <p className="max-w-xs text-gray-500">
              Create your first shopping list and SmartGrocery will start learning your route.
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="tap-target mt-2 rounded-2xl bg-green-600 px-8 text-base font-semibold text-white active:bg-green-700"
            >
              Create your first list
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {lists.map((list) => (
              <li key={list.id}>
                <ListCard
                  id={list.id}
                  name={list.name}
                  storeName={list.storeName}
                  createdAt={list.createdAt}
                  completedAt={list.completedAt}
                  itemCount={list.itemCount}
                  onDelete={() => handleDelete(list.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {showPicker && (
        <StorePickerModal onSelect={handleStoreSelect} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
