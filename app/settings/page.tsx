"use client";

import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Sheet, { ConfirmSheet } from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { PlusIcon, RouteIcon } from "@/components/icons";
import { api } from "@/lib/client";

interface Store {
  id: number;
  name: string;
  address: string | null;
  listCount: number;
  learnedCount: number;
}

interface StoreDetail {
  id: number;
  name: string;
  address: string | null;
  tripCount: number;
  route: { itemId: number; name: string; avgOrder: number; timesSeen: number }[];
}

export default function SettingsPage() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<StoreDetail | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      setStores(await api<Store[]>("/api/stores"));
    } catch {
      toast("Couldn't load stores", { tone: "error" });
      setStores([]);
    }
  }, [toast]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  async function addStore() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await api("/api/stores", { method: "POST", body: { name } });
      setNewName("");
      fetchStores();
    } catch {
      toast("Couldn't add store", { tone: "error" });
    } finally {
      setAdding(false);
    }
  }

  async function openStore(id: number) {
    try {
      const detail = await api<StoreDetail>(`/api/stores/${id}`);
      setSelected(detail);
      setEditName(detail.name);
      setEditAddress(detail.address ?? "");
    } catch {
      toast("Couldn't open store", { tone: "error" });
    }
  }

  async function saveStore() {
    if (!selected || !editName.trim()) return;
    setBusy(true);
    try {
      await api(`/api/stores/${selected.id}`, {
        method: "PATCH",
        body: { name: editName, address: editAddress },
      });
      setSelected(null);
      fetchStores();
    } catch {
      toast("Couldn't save store", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!selected || !confirm) return;
    setBusy(true);
    try {
      if (confirm === "reset") {
        await api(`/api/stores/${selected.id}/learning`, { method: "DELETE" });
        toast(`Route for ${selected.name} reset`);
      } else {
        await api(`/api/stores/${selected.id}`, { method: "DELETE" });
        toast(`${selected.name} deleted`);
      }
      setSelected(null);
      fetchStores();
    } catch {
      toast("Something went wrong", { tone: "error" });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="pt-safe sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">Stores</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each store learns its own route
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {stores === null ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : (
          <>
            {stores.length === 0 && (
              <p className="mb-4 text-center text-gray-500 dark:text-gray-400">
                No stores yet — add the shops you visit.
              </p>
            )}
            <ul className="space-y-2">
              {stores.map((store) => (
                <li key={store.id}>
                  <button
                    onClick={() => openStore(store.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-transform active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{store.name}</span>
                      <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
                        {[
                          store.address,
                          `${store.listCount} list${store.listCount === 1 ? "" : "s"}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        store.learnedCount
                          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {store.learnedCount ? `${store.learnedCount} learned` : "Not learned yet"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <input
                value={newName}
                maxLength={60}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStore()}
                placeholder="Add a store, e.g. Lidl"
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                onClick={addStore}
                disabled={adding || !newName.trim()}
                aria-label="Add store"
                className="tap-target flex items-center justify-center rounded-xl bg-green-600 text-white active:bg-green-700 disabled:opacity-40"
              >
                <PlusIcon />
              </button>
            </div>

            <section className="mt-10 rounded-2xl bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
              <h2 className="mb-1 flex items-center gap-2 font-semibold">
                <RouteIcon className="h-4 w-4" /> How route learning works
              </h2>
              <p>
                In Shopping Mode, tick items in the order you pick them up. When you tap Done,
                SmartGrocery averages each item&apos;s position across your trips at that store and
                sorts your next list to match the way you walk.
              </p>
            </section>
          </>
        )}
      </main>

      <BottomNav />

      {selected && !confirm && (
        <Sheet title={selected.name} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <input
              value={editName}
              maxLength={60}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="Store name"
              className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
            />
            <input
              value={editAddress}
              maxLength={120}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Branch / address (optional)"
              aria-label="Store address"
              className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700"
            />
            <button
              onClick={saveStore}
              disabled={busy || !editName.trim()}
              className="tap-target w-full rounded-2xl bg-green-600 font-bold text-white active:bg-green-700 disabled:opacity-40"
            >
              Save
            </button>
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold">
            Your route{" "}
            <span className="font-normal text-gray-500">
              · {selected.tripCount} trip{selected.tripCount === 1 ? "" : "s"}
            </span>
          </h3>
          {selected.route.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nothing learned yet. Finish a shopping trip at {selected.name} to start.
            </p>
          ) : (
            <ol className="max-h-64 space-y-1 overflow-y-auto rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800">
              {selected.route.map((r, i) => (
                <li key={r.itemId} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-right tabular-nums text-gray-400">
                    {i + 1}
                  </span>
                  <span className="capitalize-first min-w-0 flex-1 truncate">{r.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">seen {r.timesSeen}×</span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 space-y-1 pb-3">
            {selected.route.length > 0 && (
              <button
                onClick={() => setConfirm("reset")}
                className="tap-target w-full rounded-2xl text-sm font-semibold text-amber-700 active:bg-amber-50 dark:text-amber-400 dark:active:bg-amber-950"
              >
                Reset learned route
              </button>
            )}
            <button
              onClick={() => setConfirm("delete")}
              className="tap-target w-full rounded-2xl text-sm font-semibold text-red-600 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950"
            >
              Delete store
            </button>
          </div>
        </Sheet>
      )}

      {selected && confirm && (
        <ConfirmSheet
          title={confirm === "reset" ? "Reset route?" : `Delete ${selected.name}?`}
          message={
            confirm === "reset"
              ? `SmartGrocery will forget the order you walk ${selected.name}. Useful after a store refit.`
              : "Its learned route is deleted. Your lists for this store are kept, just without a store."
          }
          confirmLabel={confirm === "reset" ? "Reset route" : "Delete store"}
          destructive
          busy={busy}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
