"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { getCategory } from "@/lib/categories";
import { api, relativeDays } from "@/lib/client";

interface Insights {
  tripCount: number;
  itemsBought: number;
  avgItemsPerTrip: number;
  avgTripMinutes: number | null;
  topItems: {
    itemId: number;
    name: string;
    category: string | null;
    timesBought: number;
    daysSinceLast: number;
    avgIntervalDays: number | null;
  }[];
  leftBehind: { itemId: number; name: string; count: number }[];
  stores: { name: string; count: number }[];
  categories: { category: string; count: number }[];
  recentTrips: {
    listId: number;
    storeName: string | null;
    completedAt: string;
    checked: number;
    total: number;
    minutes: number | null;
  }[];
}

function formatInterval(days: number | null): string | null {
  if (days === null) return null;
  if (days < 1.5) return "every day";
  if (days < 10) return `every ${Math.round(days)} days`;
  return `every ${Math.round(days / 7)} weeks`;
}

function formatMinutes(minutes: number): string {
  return minutes < 1 ? "<1 min" : `${Math.round(minutes)} min`;
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<Insights>("/api/insights")
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const maxTop = data?.topItems[0]?.timesBought ?? 1;
  const totalCat = data?.categories.reduce((s, c) => s + c.count, 0) ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="pt-safe sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">Insights</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">What your shopping says</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pb-28 pt-4">
        {error ? (
          <p className="py-20 text-center text-gray-500">Couldn&apos;t load insights.</p>
        ) : !data ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : data.tripCount === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">📊</span>
            <h2 className="text-lg font-bold">No trips yet</h2>
            <p className="max-w-xs text-gray-500 dark:text-gray-400">
              Finish your first shopping trip and your buying habits will show up here.
            </p>
            <Link href="/lists" className="mt-2 font-semibold text-green-700 dark:text-green-400">
              Go to your lists
            </Link>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3">
              <Stat label="Trips" value={String(data.tripCount)} />
              <Stat label="Items bought" value={String(data.itemsBought)} />
              <Stat label="Items per trip" value={data.avgItemsPerTrip.toFixed(1)} />
              <Stat
                label="Avg. time in store"
                value={data.avgTripMinutes === null ? "—" : formatMinutes(data.avgTripMinutes)}
              />
            </section>

            {data.topItems.length > 0 && (
              <Card title="Most bought">
                <ol className="space-y-3">
                  {data.topItems.map((item, i) => (
                    <li key={item.itemId}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                          <span className="mr-2 text-gray-400">{i + 1}</span>
                          <span aria-hidden="true">{getCategory(item.category).emoji}</span>{" "}
                          <span className="capitalize-first inline-block font-medium">
                            {item.name}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {item.timesBought}×
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${(item.timesBought / maxTop) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Last bought {relativeDays(item.daysSinceLast)}
                        {formatInterval(item.avgIntervalDays) &&
                          ` · usually ${formatInterval(item.avgIntervalDays)}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {data.categories.length > 0 && (
              <Card title="Your basket by aisle">
                <div className="mb-3 flex h-3 overflow-hidden rounded-full">
                  {data.categories.map((c, i) => (
                    <div
                      key={c.category}
                      title={`${getCategory(c.category).label}: ${c.count}`}
                      className="h-full border-r-2 border-white last:border-r-0 dark:border-gray-900"
                      style={{
                        width: `${(c.count / totalCat) * 100}%`,
                        backgroundColor: `hsl(142 ${70 - i * 6}% ${32 + i * 7}%)`,
                      }}
                    />
                  ))}
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {data.categories.map((c) => (
                    <li key={c.category} className="flex justify-between gap-2">
                      <span className="truncate">
                        {getCategory(c.category).emoji} {getCategory(c.category).label}
                      </span>
                      <span className="tabular-nums text-gray-500">
                        {Math.round((c.count / totalCat) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {data.leftBehind.length > 0 && (
              <Card title="Often left on the list">
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Added but not ticked when you finished — out of stock, or forgotten?
                </p>
                <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                  {data.leftBehind.map((item) => (
                    <li key={item.itemId} className="flex justify-between py-2">
                      <span className="capitalize-first inline-block">{item.name}</span>
                      <span className="text-gray-500">
                        {item.count} trip{item.count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {data.stores.length > 0 && (
              <Card title="Where you shop">
                <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                  {data.stores.map((s) => (
                    <li key={s.name} className="flex justify-between py-2">
                      <span>{s.name}</span>
                      <span className="text-gray-500">
                        {s.count} trip{s.count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Recent trips">
              <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {data.recentTrips.map((t) => (
                  <li key={t.listId}>
                    <Link href={`/lists/${t.listId}`} className="flex justify-between gap-3 py-2.5">
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{t.storeName ?? "Shop"}</span>{" "}
                        <span className="text-gray-500">
                          {new Date(t.completedAt).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </span>
                      <span className="shrink-0 text-gray-500">
                        {t.checked}/{t.total}
                        {t.minutes !== null && ` · ${formatMinutes(t.minutes)}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
