"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddItemBar from "@/components/AddItemBar";
import ItemRow from "@/components/ItemRow";

interface ListItem {
  listItemId: number;
  itemId: number;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  checked: boolean;
  checkedOrder: number | null;
  note: string | null;
}

interface ListDetail {
  id: number;
  name: string | null;
  store: { id: number; name: string } | null;
  createdAt: string;
  completedAt: string | null;
  items: ListItem[];
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const listId = parseInt(params.id, 10);
  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    const res = await fetch(`/api/lists/${listId}`);
    if (res.ok) {
      setList(await res.json());
    }
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleDelete(listItemId: number) {
    await fetch(`/api/list-items/${listItemId}`, { method: "DELETE" });
    setList((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.listItemId !== listItemId) } : prev
    );
  }

  async function handleStartShopping() {
    router.push(`/shop/${listId}`);
  }

  const displayName =
    list?.name ??
    `${list?.store?.name ?? "Shop"} – ${
      list
        ? new Date(list.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        : ""
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
        <Link
          href="/lists"
          className="tap-target flex items-center justify-center text-2xl leading-none text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          aria-label="Back"
        >
          ‹
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{loading ? "…" : displayName}</h1>
          {list?.store && <p className="text-sm text-gray-500">{list.store.name}</p>}
        </div>
      </header>

      {/* Add item bar */}
      {list && !list.completedAt && (
        <div className="sticky top-[69px] z-10 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <AddItemBar listId={listId} onAdded={fetchList} />
        </div>
      )}

      {/* Items */}
      <main className="flex-1 px-4 py-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : !list ? (
          <div className="py-20 text-center text-gray-400">List not found.</div>
        ) : list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <span className="text-4xl">📝</span>
            <p className="text-gray-500">No items yet — add your first item above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.items.map((item) => (
              <ItemRow
                key={item.listItemId}
                listItemId={item.listItemId}
                name={item.name}
                quantity={item.quantity}
                unit={item.unit}
                note={item.note}
                checked={item.checked}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </main>

      {/* Sticky footer — Start Shopping */}
      {list && !list.completedAt && (
        <div className="pb-safe fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={handleStartShopping}
            disabled={!list.items.length}
            className="tap-target w-full rounded-2xl bg-green-600 text-base font-bold text-white transition-colors active:bg-green-700 disabled:opacity-40"
          >
            🛒 Start Shopping
          </button>
        </div>
      )}

      {list?.completedAt && (
        <div className="pb-safe fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
          Completed{" "}
          {new Date(list.completedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
