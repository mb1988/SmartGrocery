/**
 * learning.ts — Core learning algorithm for SmartGrocery
 *
 * Calculates the average check-off order for items in a given store
 * and reorders a list to match the user's real-world walking path.
 *
 * Algorithm: running average per item per (user, store) pair.
 *   new_avg = ((old_avg × times_seen) + checked_order) / (times_seen + 1)
 *
 * See _plan/03_learning_system.md for full design and edge cases.
 */

import { db } from "@/lib/db";

/**
 * Returns the learned avg_order for each of the given items at a store.
 * Items with no learning history are absent from the map.
 */
export async function getLearnedOrder(
  userId: number,
  storeId: number,
  itemIds: number[]
): Promise<Map<number, number>> {
  if (itemIds.length === 0) return new Map();

  const rows = await db.storeItemOrder.findMany({
    where: { userId, storeId, itemId: { in: itemIds } },
    select: { itemId: true, avgOrder: true },
  });

  return new Map(rows.map((r) => [r.itemId, r.avgOrder]));
}

/**
 * Sorts items by the user's learned avg_order (ASC). Items with no learning
 * history go to the end, sorted alphabetically. Ties on avg_order are also
 * broken alphabetically (_plan/03_learning_system.md → Edge Cases).
 */
export function sortByLearnedOrder<T extends { itemId: number; name: string }>(
  items: T[],
  avgMap: Map<number, number>
): T[] {
  return [...items].sort((a, b) => {
    const aAvg = avgMap.get(a.itemId);
    const bAvg = avgMap.get(b.itemId);

    if (aAvg !== undefined && bAvg !== undefined && aAvg !== bAvg) return aAvg - bAvg;
    // Only one side is known — the known item comes first
    if (aAvg !== undefined && bAvg === undefined) return -1;
    if (aAvg === undefined && bAvg !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Called when a shopping list is marked complete. Reads every checked item
 * from the list and upserts its avg_order in store_item_order using a
 * running average. Items that were added but never checked are ignored.
 */
export async function updateLearning(
  userId: number,
  storeId: number,
  listId: number
): Promise<void> {
  // Fetch only items that were actually checked off (checkedOrder set)
  const checkedItems = await db.listItem.findMany({
    where: {
      listId,
      checked: true,
      checkedOrder: { not: null },
    },
    orderBy: { checkedOrder: "asc" },
    select: { itemId: true, checkedOrder: true },
  });

  if (checkedItems.length === 0) return;

  // Re-number 1..N so gaps left by unchecking (e.g. 1, 2, 5) don't skew the average,
  // and collapse duplicate items on the same list to their first position.
  const positions = new Map<number, number>();
  for (const { itemId } of checkedItems) {
    if (!positions.has(itemId)) positions.set(itemId, positions.size + 1);
  }

  const existing = await db.storeItemOrder.findMany({
    where: { userId, storeId, itemId: { in: [...positions.keys()] } },
  });
  const existingMap = new Map(existing.map((e) => [e.itemId, e]));
  const now = new Date();

  await db.$transaction(
    [...positions.entries()].map(([itemId, order]) => {
      const prev = existingMap.get(itemId);
      if (prev) {
        const newAvg = (prev.avgOrder * prev.timesSeen + order) / (prev.timesSeen + 1);
        return db.storeItemOrder.update({
          where: { id: prev.id },
          data: { avgOrder: newAvg, timesSeen: prev.timesSeen + 1, lastSeen: now },
        });
      }
      return db.storeItemOrder.create({
        data: { userId, storeId, itemId, avgOrder: order, timesSeen: 1, lastSeen: now },
      });
    })
  );
}

/** Wipes all learned route data for one store (Settings → "Reset route"). */
export async function resetLearning(userId: number, storeId: number): Promise<number> {
  const { count } = await db.storeItemOrder.deleteMany({ where: { userId, storeId } });
  return count;
}
