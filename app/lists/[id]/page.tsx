"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddItemBar from "@/components/AddItemBar";
import ItemRow from "@/components/ItemRow";
import ItemEditSheet from "@/components/ItemEditSheet";
import SuggestionChips, { type Suggestion } from "@/components/SuggestionChips";
import Sheet, { ConfirmSheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import {
  BackIcon,
  CartIcon,
  EditIcon,
  MoreIcon,
  RepeatIcon,
  RouteIcon,
  TrashIcon,
} from "@/components/icons";
import { api, haptic, listDisplayName } from "@/lib/client";

interface ListItem {
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
  learned: boolean;
}

interface ListDetail {
  id: number;
  name: string | null;
  store: { id: number; name: string } | null;
  createdAt: string;
  completedAt: string | null;
  learnedCount: number;
  items: ListItem[];
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const listId = parseInt(params.id, 10);
  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [cloning, setCloning] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      setSuggestions(await api<Suggestion[]>(`/api/suggestions?listId=${listId}`));
    } catch {
      setSuggestions([]);
    }
  }, [listId]);

  const fetchList = useCallback(async () => {
    try {
      const data = await api<ListDetail>(`/api/lists/${listId}`);
      setList(data);
      if (!data.completedAt) fetchSuggestions();
    } catch {
      setList(null);
    } finally {
      setLoading(false);
    }
  }, [listId, fetchSuggestions]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const displayName = list ? listDisplayName(list.name, list.store?.name, list.createdAt) : "";
  const editingItem = list?.items.find((i) => i.listItemId === editingItemId) ?? null;

  async function handleDelete(listItemId: number) {
    const removed = list?.items.find((i) => i.listItemId === listItemId);
    if (!removed) return;
    setEditingItemId(null);
    setList((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.listItemId !== listItemId) } : prev
    );
    try {
      await api(`/api/list-items/${listItemId}`, { method: "DELETE" });
      toast(`Removed ${removed.name}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await api("/api/list-items", {
              method: "POST",
              body: {
                listId,
                itemName: removed.name,
                quantity: removed.quantity,
                unit: removed.unit,
                note: removed.note,
              },
            }).catch(() => toast("Couldn't restore item", { tone: "error" }));
            fetchList();
          },
        },
      });
      fetchSuggestions();
    } catch {
      toast(`Couldn't remove ${removed.name}`, { tone: "error" });
      fetchList();
    }
  }

  async function handleSaveItem(
    listItemId: number,
    changes: { quantity: number; unit: string | null; note: string | null }
  ) {
    setEditingItemId(null);
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => (i.listItemId === listItemId ? { ...i, ...changes } : i)),
          }
        : prev
    );
    try {
      await api(`/api/list-items/${listItemId}`, {
        method: "PATCH",
        // Empty strings clear the unit / note server-side
        body: { quantity: changes.quantity, unit: changes.unit ?? "", note: changes.note ?? "" },
      });
    } catch {
      toast("Couldn't save changes", { tone: "error" });
      fetchList();
    }
  }

  async function handleAddSuggestion(s: Suggestion) {
    haptic();
    setSuggestions((prev) => prev.filter((x) => x.itemId !== s.itemId));
    try {
      await api("/api/list-items", { method: "POST", body: { listId, itemName: s.name } });
      fetchList();
    } catch {
      toast(`Couldn't add ${s.name}`, { tone: "error" });
    }
  }

  function startEditingName() {
    if (!list || list.completedAt) return;
    setShowMenu(false);
    setNameInput(list.name ?? displayName);
    setEditingName(true);
  }

  async function commitName() {
    setEditingName(false);
    const trimmed = nameInput.trim();
    if (!list || trimmed === (list.name ?? displayName)) return;
    setList((prev) => (prev ? { ...prev, name: trimmed || null } : prev));
    try {
      await api(`/api/lists/${listId}`, { method: "PATCH", body: { name: trimmed } });
    } catch {
      toast("Couldn't rename the list", { tone: "error" });
      fetchList();
    }
  }

  async function handleRepeat() {
    if (!list) return;
    setShowMenu(false);
    setCloning(true);
    try {
      const newList = await api<{ id: number }>("/api/lists", {
        method: "POST",
        body: { storeId: list.store?.id ?? null, name: list.name, cloneFromListId: listId },
      });
      router.push(`/lists/${newList.id}`);
    } catch {
      toast("Couldn't copy the list", { tone: "error" });
      setCloning(false);
    }
  }

  async function handleDeleteList() {
    setDeleting(true);
    try {
      await api(`/api/lists/${listId}`, { method: "DELETE" });
      router.replace("/lists");
    } catch {
      toast("Couldn't delete the list", { tone: "error" });
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const isActive = !!list && !list.completedAt;
  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header + add bar share one sticky container so offsets never drift */}
      <div className="pt-safe sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <header className="mx-auto flex max-w-lg items-center gap-1 px-2 py-2">
          <Link
            href="/lists"
            className="tap-target flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            aria-label="Back to lists"
          >
            <BackIcon className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                maxLength={80}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                aria-label="List name"
                className="w-full rounded-lg border border-green-400 bg-transparent px-2 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-green-500 dark:border-green-500"
              />
            ) : (
              <button
                type="button"
                className="block w-full min-w-0 text-left disabled:cursor-default"
                onClick={startEditingName}
                disabled={!isActive}
                title={isActive ? "Tap to rename" : undefined}
              >
                <h1 className="truncate text-lg font-bold leading-tight">
                  {loading ? "…" : displayName}
                </h1>
                {list && (
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {[list.name && list.store?.name, `${list.items.length} items`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </button>
            )}
          </div>
          {list && (
            <button
              onClick={() => setShowMenu(true)}
              aria-label="List options"
              className="tap-target flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <MoreIcon className="h-6 w-6" />
            </button>
          )}
        </header>

        {isActive && (
          <div className="mx-auto max-w-lg px-4 pb-3">
            <AddItemBar listId={listId} onAdded={fetchList} />
          </div>
        )}
      </div>

      {/* Items */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : !list ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-gray-500">This list doesn&apos;t exist any more.</p>
            <Link href="/lists" className="font-semibold text-green-700 dark:text-green-400">
              Back to your lists
            </Link>
          </div>
        ) : (
          <>
            {isActive && <SuggestionChips suggestions={suggestions} onAdd={handleAddSuggestion} />}

            {list.store && list.items.length > 1 && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
                <RouteIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {list.learnedCount > 0 ? (
                    <>
                      Sorted by your route at <strong>{list.store.name}</strong> ·{" "}
                      {list.learnedCount} of {list.items.length} items learned
                    </>
                  ) : (
                    <>
                      First trip at <strong>{list.store.name}</strong>? Tick items in the order you
                      pick them up — next time this list sorts itself.
                    </>
                  )}
                </p>
              </div>
            )}

            {list.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <span className="text-4xl">📝</span>
                <p className="text-gray-500 dark:text-gray-400">
                  {isActive
                    ? "No items yet — type, speak or scan to add one."
                    : "This list had no items."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {list.items.map((item) => (
                  <ItemRow
                    key={item.listItemId}
                    {...item}
                    readOnly={!isActive}
                    onEdit={setEditingItemId}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* Sticky footer */}
      {list && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto max-w-lg px-4 pt-3">
            {isActive ? (
              <button
                onClick={() => router.push(`/shop/${listId}`)}
                disabled={!list.items.length}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-base font-bold text-white shadow-sm transition-colors active:bg-green-700 disabled:opacity-40"
              >
                <CartIcon />
                {checkedCount > 0
                  ? `Continue shopping (${checkedCount}/${list.items.length})`
                  : "Start shopping"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleRepeat}
                  disabled={cloning}
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 text-base font-bold text-white transition-colors active:bg-green-700 disabled:opacity-40"
                >
                  <RepeatIcon />
                  {cloning ? "Creating…" : "Shop this list again"}
                </button>
                <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                  Bought {checkedCount} of {list.items.length} · completed{" "}
                  {new Date(list.completedAt as string).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          onSave={(changes) => handleSaveItem(editingItem.listItemId, changes)}
          onDelete={() => handleDelete(editingItem.listItemId)}
          onClose={() => setEditingItemId(null)}
        />
      )}

      {showMenu && list && (
        <Sheet title="List options" onClose={() => setShowMenu(false)}>
          <ul className="space-y-1 pb-3">
            {isActive && (
              <li>
                <MenuButton icon={<EditIcon />} label="Rename" onClick={startEditingName} />
              </li>
            )}
            <li>
              <MenuButton
                icon={<RepeatIcon />}
                label={cloning ? "Creating…" : "Duplicate as a new list"}
                onClick={handleRepeat}
              />
            </li>
            <li>
              <MenuButton
                icon={<TrashIcon />}
                label="Delete list"
                destructive
                onClick={() => {
                  setShowMenu(false);
                  setConfirmDelete(true);
                }}
              />
            </li>
          </ul>
        </Sheet>
      )}

      {confirmDelete && list && (
        <ConfirmSheet
          title="Delete list?"
          message={`“${displayName}” and its ${list.items.length} items will be removed. Your learned store route is kept.`}
          confirmLabel="Delete list"
          destructive
          busy={deleting}
          onConfirm={handleDeleteList}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`tap-target flex w-full items-center gap-3 rounded-xl px-3 text-left font-medium hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-800 ${
        destructive ? "text-red-600 dark:text-red-400" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
