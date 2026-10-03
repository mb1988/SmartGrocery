"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShopItemButton from "@/components/ShopItemButton";
import { ConfirmSheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { BackIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { api, haptic, listDisplayName } from "@/lib/client";

interface ShopItem {
  listItemId: number;
  itemId: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
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
  isTemplate: boolean;
  items: ShopItem[];
}

// Show the search box once scrolling starts to hurt (_plan/11_competitor_analysis.md)
const SEARCH_THRESHOLD = 8;

export default function ShopPage({ params }: { params: { listId: string } }) {
  const router = useRouter();
  const toast = useToast();
  const listId = parseInt(params.listId, 10);

  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState("");
  // A ref, not state: rapid taps must never reuse the same check-off position
  const nextOrderRef = useRef(1);

  const fetchList = useCallback(async () => {
    try {
      const data = await api<ListDetail>(`/api/lists/${listId}`);
      setList(data);
      // Continue counting from highest checkedOrder already recorded
      const maxOrder = data.items.reduce((max, i) => Math.max(max, i.checkedOrder ?? 0), 0);
      nextOrderRef.current = maxOrder + 1;
    } catch {
      setList(null);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Screen Wake Lock — keep screen on while shopping. The lock is dropped whenever the
  // tab is hidden, so re-acquire it when the user comes back.
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        if (released) wakeLock.release();
      } catch {
        // Denied (e.g. low battery mode) — shopping still works, screen may sleep
      }
    }
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", acquire);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  async function handleToggle(listItemId: number, checked: boolean) {
    const previous = list?.items.find((i) => i.listItemId === listItemId);
    if (!previous) return;
    const order = checked ? nextOrderRef.current++ : null;
    haptic(checked ? 15 : [8, 40, 8]);

    // Optimistic update
    const apply = (patch: Partial<ShopItem>) =>
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) => (i.listItemId === listItemId ? { ...i, ...patch } : i)),
            }
          : prev
      );
    apply({ checked, checkedOrder: order });
    if (checked && search) setSearch("");

    try {
      await api(`/api/list-items/${listItemId}`, {
        method: "PATCH",
        body: { checked, checkedOrder: order ?? undefined },
      });
    } catch {
      apply({ checked: previous.checked, checkedOrder: previous.checkedOrder });
      toast("No connection — that tick wasn't saved", { tone: "error" });
    }
  }

  async function handleDoneShopping(skipLearning: boolean) {
    setFinishing(true);
    try {
      await api(`/api/lists/${listId}`, {
        method: "PATCH",
        body: { completed: true, skipLearning },
      });
      haptic([20, 60, 20]);
      toast(
        list?.store && !skipLearning && checkedCount > 0
          ? `Nice! Your ${list.store.name} route has been updated.`
          : "Shopping trip saved."
      );
      router.push("/lists");
    } catch {
      toast("Couldn't finish — check your connection", { tone: "error" });
      setFinishing(false);
    }
  }

  const query = search.trim().toLowerCase();
  const matches = (i: ShopItem) =>
    !query || i.name.includes(query) || i.note?.toLowerCase().includes(query);
  const allItems = list?.items ?? [];
  const unchecked = allItems.filter((i) => !i.checked && matches(i));
  const checked = allItems
    .filter((i) => i.checked && matches(i))
    .sort((a, b) => (b.checkedOrder ?? 0) - (a.checkedOrder ?? 0));
  const total = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;
  const remaining = total - checkedCount;
  const progress = total > 0 ? (checkedCount / total) * 100 : 0;
  const allDone = total > 0 && remaining === 0;

  if (!loading && (list?.completedAt || list?.isTemplate)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">{list.isTemplate ? "📋" : "✅"}</span>
        <h1 className="text-xl font-bold">
          {list.isTemplate
            ? "Templates aren't shopped directly — start a list from it first"
            : "This trip is already finished"}
        </h1>
        <Link
          href={`/lists/${listId}`}
          className="tap-target flex items-center rounded-2xl bg-green-600 px-6 font-semibold text-white"
        >
          View list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-lg px-2 pb-3 pt-2">
          <div className="mb-2 flex items-center gap-1">
            <Link
              href={`/lists/${listId}`}
              className="tap-target flex items-center justify-center rounded-full text-gray-500"
              aria-label="Back to list"
            >
              <BackIcon className="h-6 w-6" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold leading-tight">
                {list
                  ? (list.store?.name ?? listDisplayName(list.name, null, list.createdAt))
                  : "Shopping"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
                {allDone
                  ? "All items ticked 🎉"
                  : `${checkedCount} of ${total} · ${remaining} to go`}
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={finishing || loading || !list}
              className="tap-target mr-1 rounded-xl bg-green-600 px-5 text-sm font-bold text-white active:bg-green-700 disabled:opacity-40"
            >
              Done
            </button>
          </div>

          {/* Progress bar */}
          <div
            className="mx-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={checkedCount}
          >
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {total > SEARCH_THRESHOLD && (
            <div className="relative mx-2 mt-3">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find an item"
                aria-label="Find an item"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-gray-400"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Items */}
      <main className="mx-auto w-full max-w-lg flex-1 space-y-2 px-4 pb-10 pt-4">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
            />
          ))
        ) : !list ? (
          <p className="py-20 text-center text-gray-500">Couldn&apos;t load this list.</p>
        ) : (
          <>
            {unchecked.map((item) => (
              <ShopItemButton key={item.listItemId} {...item} onToggle={handleToggle} />
            ))}

            {query && unchecked.length === 0 && checked.length === 0 && (
              <p className="py-10 text-center text-gray-500">
                Nothing on your list matches “{search}”.
              </p>
            )}

            {allDone && !query && (
              <div className="rounded-2xl bg-green-50 p-5 text-center dark:bg-green-950">
                <p className="text-3xl">🎉</p>
                <p className="mt-1 font-semibold">Everything&apos;s in the trolley!</p>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="tap-target mt-3 w-full rounded-2xl bg-green-600 font-bold text-white active:bg-green-700"
                >
                  Finish shopping
                </button>
              </div>
            )}

            {checked.length > 0 && (
              <>
                <div className="flex items-center gap-3 pb-1 pt-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
                    In the trolley · {checkedCount}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>
                {checked.map((item) => (
                  <ShopItemButton key={item.listItemId} {...item} onToggle={handleToggle} />
                ))}
              </>
            )}
          </>
        )}
      </main>

      {/* Confirmation sheet */}
      {showConfirm && (
        <ConfirmSheet
          title="Done shopping?"
          message={
            remaining > 0
              ? `${remaining} item${remaining !== 1 ? "s" : ""} not ticked. ${
                  list?.store ? "SmartGrocery will still learn the order of what you did tick." : ""
                }`
              : list?.store
                ? `All items ticked. SmartGrocery will update your ${list.store.name} route for next time.`
                : "All items ticked."
          }
          confirmLabel={list?.store ? "Finish & learn my route" : "Finish shopping"}
          cancelLabel="Keep shopping"
          busy={finishing}
          onConfirm={() => handleDoneShopping(false)}
          onClose={() => setShowConfirm(false)}
        >
          {list?.store && checkedCount > 0 && (
            <button
              onClick={() => handleDoneShopping(true)}
              disabled={finishing}
              className="tap-target w-full rounded-2xl text-sm font-medium text-gray-600 active:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:active:bg-gray-800"
            >
              Finish without learning (unusual trip)
            </button>
          )}
        </ConfirmSheet>
      )}
    </div>
  );
}
