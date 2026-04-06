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
 * Given a list of item IDs for a store, return them sorted by the user's
 * learned avg_order (ASC). Items with no learning history go to the end,
 * sorted by itemId as a stable fallback.
 */
export async function getSortedItemIds(
  userId: number,
  storeId: number,
  itemIds: number[]
): Promise<number[]> {
  if (itemIds.length === 0) return [];

  const rows = await db.storeItemOrder.findMany({
    where: { userId, storeId, itemId: { in: itemIds } },
    select: { itemId: true, avgOrder: true },
  });

  const avgMap = new Map(rows.map((r) => [r.itemId, r.avgOrder]));

  return [...itemIds].sort((a, b) => {
    const aAvg = avgMap.get(a);
    const bAvg = avgMap.get(b);

    // Both known — sort by avg_order
    if (aAvg !== undefined && bAvg !== undefined) return aAvg - bAvg;
    // Only a is known — a comes first
    if (aAvg !== undefined) return -1;
    // Only b is known — b comes first
    if (bAvg !== undefined) return 1;
    // Both unknown — stable sort by id
    return a - b;
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
    select: { itemId: true, checkedOrder: true },
  });

  if (checkedItems.length === 0) return;

  for (const { itemId, checkedOrder } of checkedItems) {
    // checkedOrder is guaranteed non-null by the query filter above
    const order = checkedOrder as number;

    const existing = await db.storeItemOrder.findUnique({
      where: { userId_storeId_itemId: { userId, storeId, itemId } },
    });

    if (existing) {
      const newAvg = (existing.avgOrder * existing.timesSeen + order) / (existing.timesSeen + 1);

      await db.storeItemOrder.update({
        where: { userId_storeId_itemId: { userId, storeId, itemId } },
        data: {
          avgOrder: newAvg,
          timesSeen: existing.timesSeen + 1,
          lastSeen: new Date(),
        },
      });
    } else {
      await db.storeItemOrder.create({
        data: {
          userId,
          storeId,
          itemId,
          avgOrder: order,
          timesSeen: 1,
          lastSeen: new Date(),
        },
      });
    }
  }
}
