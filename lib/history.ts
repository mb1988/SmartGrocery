/**
 * history.ts — Purchase history derived from completed lists.
 *
 * No extra tables: an item is "bought" when it was checked off on a list that
 * was later completed. Powers smart suggestions ("Your usuals") and the
 * Insights page (_plan/07_backlog.md → Smart Suggestions, Purchase History).
 */

import { db } from "@/lib/db";
import { normalizeCategory } from "@/lib/categories";

const DAY_MS = 24 * 60 * 60 * 1000;
// Bounded so history queries stay cheap as usage grows
const MAX_TRIPS = 100;

export interface Trip {
  listId: number;
  storeId: number | null;
  storeName: string | null;
  completedAt: Date;
  items: {
    itemId: number;
    name: string;
    category: string | null;
    checked: boolean;
    checkedAt: Date | null;
  }[];
}

export async function getTrips(userId: number): Promise<Trip[]> {
  const lists = await db.list.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: MAX_TRIPS,
    select: {
      id: true,
      storeId: true,
      store: { select: { name: true } },
      completedAt: true,
      items: {
        select: {
          itemId: true,
          checked: true,
          checkedAt: true,
          item: { select: { name: true, category: true } },
        },
      },
    },
  });

  return lists.map((l) => ({
    listId: l.id,
    storeId: l.storeId,
    storeName: l.store?.name ?? null,
    completedAt: l.completedAt as Date,
    items: l.items.map((li) => ({
      itemId: li.itemId,
      name: li.item.name,
      category: normalizeCategory(li.item.category, li.item.name),
      checked: li.checked,
      checkedAt: li.checkedAt,
    })),
  }));
}

export interface ItemStats {
  itemId: number;
  name: string;
  category: string | null;
  timesBought: number;
  lastBought: Date;
  daysSinceLast: number;
  /** Average days between purchases; null until bought at least twice. */
  avgIntervalDays: number | null;
  storeIds: Set<number>;
}

/** Aggregates per-item purchase stats across completed trips (newest first). */
export function getItemStats(trips: Trip[], now = new Date()): ItemStats[] {
  const byItem = new Map<number, ItemStats & { dates: Date[] }>();

  for (const trip of trips) {
    // Count each item once per trip even if it appears twice on the list
    const seenThisTrip = new Set<number>();
    for (const item of trip.items) {
      if (!item.checked || seenThisTrip.has(item.itemId)) continue;
      seenThisTrip.add(item.itemId);

      let stats = byItem.get(item.itemId);
      if (!stats) {
        stats = {
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          timesBought: 0,
          lastBought: trip.completedAt,
          daysSinceLast: 0,
          avgIntervalDays: null,
          storeIds: new Set(),
          dates: [],
        };
        byItem.set(item.itemId, stats);
      }
      stats.timesBought += 1;
      stats.dates.push(trip.completedAt);
      if (trip.storeId) stats.storeIds.add(trip.storeId);
      if (trip.completedAt > stats.lastBought) stats.lastBought = trip.completedAt;
    }
  }

  return [...byItem.values()].map(({ dates, ...stats }) => {
    const sorted = dates.map((d) => d.getTime()).sort((a, b) => a - b);
    const span = sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0;
    return {
      ...stats,
      daysSinceLast: Math.floor((now.getTime() - stats.lastBought.getTime()) / DAY_MS),
      // Several trips on the same day don't tell us a buying rhythm yet
      avgIntervalDays:
        sorted.length > 1 && span >= DAY_MS ? span / (sorted.length - 1) / DAY_MS : null,
    };
  });
}

export interface Suggestion {
  itemId: number;
  name: string;
  category: string | null;
  timesBought: number;
  daysSinceLast: number;
  due: boolean;
}

/**
 * Items the user regularly buys that aren't on the current list. Items that are
 * "due" (it's been about as long as their usual buying interval) rank first.
 */
export function getSuggestions(
  stats: ItemStats[],
  excludeItemIds: Set<number>,
  totalTrips: number,
  storeId: number | null,
  limit = 8
): Suggestion[] {
  return stats
    .filter((s) => !excludeItemIds.has(s.itemId))
    .map((s) => {
      const due =
        s.avgIntervalDays !== null && s.daysSinceLast >= Math.max(1, s.avgIntervalDays * 0.8);
      const frequency = s.timesBought / Math.max(1, totalTrips);
      const sameStore = storeId !== null && s.storeIds.has(storeId) ? 0.25 : 0;
      return { s, due, score: (due ? 1 : 0) + frequency + sameStore };
    })
    .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name))
    .slice(0, limit)
    .map(({ s, due }) => ({
      itemId: s.itemId,
      name: s.name,
      category: s.category,
      timesBought: s.timesBought,
      daysSinceLast: s.daysSinceLast,
      due,
    }));
}

/** Minutes from the first tick to completion, ignoring implausible sessions. */
export function tripDurationMinutes(trip: Trip): number | null {
  const ticks = trip.items
    .map((i) => i.checkedAt?.getTime())
    .filter((t): t is number => typeof t === "number");
  if (ticks.length < 2) return null;
  const start = Math.min(...ticks);
  const end = Math.max(Math.max(...ticks), trip.completedAt.getTime());
  const minutes = (end - start) / 60000;
  // Lists ticked over several days aren't a single shopping trip
  return minutes > 0 && minutes < 240 ? minutes : null;
}
