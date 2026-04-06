"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ShopItemButton from "@/components/ShopItemButton";

interface ShopItem {
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
  completedAt: string | null;
  items: ShopItem[];
}

export default function ShopPage({ params }: { params: { listId: string } }) {
  const router = useRouter();
  const listId = parseInt(params.listId, 10);

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextOrder, setNextOrder] = useState(1);
  const [finishing, setFinishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchList = useCallback(async () => {
    const res = await fetch(`/api/lists/${listId}`);
    if (res.ok) {
      const data: ListDetail = await res.json();
      setList(data);
      // Continue counting from highest checkedOrder already recorded
      const maxOrder = data.items.reduce((max, i) => Math.max(max, i.checkedOrder ?? 0), 0);
      setNextOrder(maxOrder + 1);
    }
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Screen Wake Lock — keep screen on while shopping
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((wl) => {
        wakeLock = wl;
      });
    }
    return () => {
      wakeLock?.release();
    };
  }, []);

  async function handleToggle(listItemId: number, checked: boolean) {
    const order = checked ? nextOrder : null;
    if (checked) setNextOrder((n) => n + 1);

    // Optimistic update
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.listItemId === listItemId ? { ...i, checked, checkedOrder: order } : i
            ),
          }
        : prev
    );

    await fetch(`/api/list-items/${listItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked, checkedOrder: order ?? undefined }),
    });
  }

  async function handleDoneShopping() {
    setFinishing(true);
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    setFinishing(false);
    router.push("/lists");
  }

  const unchecked = list?.items.filter((i) => !i.checked) ?? [];
  const checked =
    list?.items
      .filter((i) => i.checked)
      .sort((a, b) => (a.checkedOrder ?? 0) - (b.checkedOrder ?? 0)) ?? [];
  const total = list?.items.length ?? 0;
  const checkedCount = checked.length;
  const progress = total > 0 ? (checkedCount / total) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{list?.store?.name ?? "Shopping"}</h1>
            <p className="text-sm text-gray-500">
              {checkedCount} of {total} items
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={finishing}
            className="tap-target rounded-xl bg-green-600 px-4 text-sm font-bold text-white active:bg-green-700 disabled:opacity-40"
          >
            Done ✓
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Items */}
      <main className="flex-1 space-y-2 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : (
          <>
            {unchecked.map((item) => (
              <ShopItemButton
                key={item.listItemId}
                listItemId={item.listItemId}
                name={item.name}
                quantity={item.quantity}
                unit={item.unit}
                note={item.note}
                checked={false}
                onToggle={handleToggle}
              />
            ))}

            {checked.length > 0 && (
              <>
                {unchecked.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="shrink-0 text-xs text-gray-400">Checked off</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  </div>
                )}
                {checked.map((item) => (
                  <ShopItemButton
                    key={item.listItemId}
                    listItemId={item.listItemId}
                    name={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    note={item.note}
                    checked={true}
                    onToggle={handleToggle}
                  />
                ))}
              </>
            )}
          </>
        )}
      </main>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full space-y-4 rounded-t-3xl bg-white px-6 py-8 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">Done shopping?</h2>
            <p className="text-gray-500">
              {checkedCount < total
                ? `You have ${total - checkedCount} unchecked item${total - checkedCount !== 1 ? "s" : ""}. SmartGrocery will still update the order for what you checked.`
                : "All items checked. SmartGrocery will update your route for next time."}
            </p>
            <button
              onClick={handleDoneShopping}
              disabled={finishing}
              className="tap-target w-full rounded-2xl bg-green-600 text-base font-bold text-white active:bg-green-700 disabled:opacity-40"
            >
              {finishing ? "Saving…" : "Yes, finish shopping"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="tap-target w-full rounded-2xl border border-gray-200 text-base font-semibold active:bg-gray-50 dark:border-gray-700"
            >
              Keep shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
