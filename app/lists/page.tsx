"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ListCard from "@/components/ListCard";
import StorePickerModal from "@/components/StorePickerModal";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import { ConfirmSheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { EditIcon, PlusIcon, RepeatIcon } from "@/components/icons";
import { api, listDisplayName } from "@/lib/client";

interface ListSummary {
  id: number;
  name: string | null;
  storeId: number | null;
  storeName: string | null;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
  checkedCount: number;
  preview: string[];
}

const COMPLETED_PREVIEW = 5;

export default function ListsPage() {
  const router = useRouter();
  const toast = useToast();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [templates, setTemplates] = useState<ListSummary[]>([]);
  // Template chosen from the Templates row — the store picker then creates a copy of it
  const [fromTemplate, setFromTemplate] = useState<ListSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ListSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const [listData, templateData] = await Promise.all([
        api<ListSummary[]>("/api/lists"),
        api<ListSummary[]>("/api/lists?templates=1"),
      ]);
      setLists(listData);
      setTemplates(templateData);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/api/lists/${pendingDelete.id}`, { method: "DELETE" });
      setLists((prev) => prev.filter((l) => l.id !== pendingDelete.id));
      toast("List deleted");
    } catch {
      toast("Couldn't delete the list", { tone: "error" });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function handleStoreSelect(storeId: number | null, name: string | null) {
    const template = fromTemplate;
    setShowPicker(false);
    setFromTemplate(null);
    setCreating(true);
    try {
      const list = await api<{ id: number }>("/api/lists", {
        method: "POST",
        body: { storeId, name, cloneFromListId: template?.id },
      });
      router.push(`/lists/${list.id}`);
    } catch {
      toast("Couldn't create the list", { tone: "error" });
      setCreating(false);
    }
  }

  const active = lists.filter((l) => !l.completedAt);
  const completed = lists.filter((l) => l.completedAt);
  const visibleCompleted = showAllCompleted ? completed : completed.slice(0, COMPLETED_PREVIEW);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Smart<span className="text-green-600">Grocery</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lists that learn your route</p>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            disabled={creating}
            className="tap-target flex items-center gap-1.5 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors active:bg-green-700 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            {creating ? "Creating…" : "New list"}
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        <InstallPrompt />

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[88px] animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-gray-500">Couldn&apos;t load your lists.</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchLists();
              }}
              className="tap-target rounded-xl border border-gray-200 px-5 font-semibold dark:border-gray-700"
            >
              Try again
            </button>
          </div>
        ) : lists.length === 0 && templates.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-4xl dark:bg-green-950">
              🛒
            </span>
            <h2 className="text-xl font-bold">No lists yet</h2>
            <p className="max-w-xs text-gray-500 dark:text-gray-400">
              Create your first shopping list. Every trip teaches SmartGrocery the order you walk
              the store — next time your list is already sorted.
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="tap-target mt-2 rounded-2xl bg-green-600 px-8 text-base font-semibold text-white active:bg-green-700"
            >
              Create your first list
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Active
                </h2>
                <ul className="space-y-3">
                  {active.map((list) => (
                    <li key={list.id}>
                      <ListCard {...list} onDelete={() => setPendingDelete(list)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {active.length === 0 && (
              <button
                onClick={() => setShowPicker(true)}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-6 font-semibold text-gray-500 transition-colors hover:border-green-400 hover:text-green-600 dark:border-gray-700 dark:text-gray-400"
              >
                <PlusIcon /> Start a new list
              </button>
            )}

            {templates.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Templates
                </h2>
                <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className="flex w-44 shrink-0 flex-col rounded-2xl border border-dashed border-green-300 bg-green-50/60 p-3 dark:border-green-800 dark:bg-green-950/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate font-semibold">{t.name}</span>
                        <Link
                          href={`/lists/${t.id}`}
                          aria-label={`Edit template ${t.name}`}
                          className="-m-1 shrink-0 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Link>
                      </div>
                      <span className="mb-3 truncate text-xs text-gray-500 dark:text-gray-400">
                        {t.itemCount} item{t.itemCount === 1 ? "" : "s"}
                        {t.preview.length > 0 && ` · ${t.preview.join(", ")}`}
                      </span>
                      <button
                        onClick={() => {
                          setFromTemplate(t);
                          setShowPicker(true);
                        }}
                        disabled={creating || t.itemCount === 0}
                        className="mt-auto flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-green-600 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-50"
                      >
                        <RepeatIcon className="h-4 w-4" /> Use
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Completed
                </h2>
                <ul className="space-y-3">
                  {visibleCompleted.map((list) => (
                    <li key={list.id}>
                      <ListCard {...list} onDelete={() => setPendingDelete(list)} />
                    </li>
                  ))}
                </ul>
                {completed.length > COMPLETED_PREVIEW && (
                  <button
                    onClick={() => setShowAllCompleted((v) => !v)}
                    className="tap-target mt-2 w-full text-sm font-medium text-green-700 dark:text-green-400"
                  >
                    {showAllCompleted ? "Show fewer" : `Show all ${completed.length} completed`}
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {showPicker && (
        <StorePickerModal
          key={fromTemplate?.id ?? "new"}
          title={fromTemplate ? `New list from “${fromTemplate.name}”` : "New list"}
          defaultName={fromTemplate?.name ?? ""}
          onSelect={handleStoreSelect}
          onClose={() => {
            setShowPicker(false);
            setFromTemplate(null);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmSheet
          title="Delete list?"
          message={
            <>
              <strong>
                {listDisplayName(
                  pendingDelete.name,
                  pendingDelete.storeName,
                  pendingDelete.createdAt
                )}
              </strong>{" "}
              and its {pendingDelete.itemCount} item{pendingDelete.itemCount === 1 ? "" : "s"} will
              be removed. Your learned store route is kept.
            </>
          }
          confirmLabel="Delete list"
          destructive
          busy={deleting}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
