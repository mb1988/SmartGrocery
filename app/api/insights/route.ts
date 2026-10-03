import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getItemStats, getTrips, tripDurationMinutes } from "@/lib/history";
import { serverError } from "@/lib/api";

// Per-user data — never prerender at build time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const trips = await getTrips(userId);
    const stats = getItemStats(trips);

    const durations = trips.map(tripDurationMinutes).filter((d): d is number => d !== null);
    const itemsBought = trips.reduce((sum, t) => sum + t.items.filter((i) => i.checked).length, 0);

    // Items that were on a completed list but never ticked — "always forgotten / out of stock"
    const leftBehind = new Map<number, { name: string; count: number }>();
    for (const trip of trips) {
      for (const item of trip.items) {
        if (item.checked) continue;
        const entry = leftBehind.get(item.itemId) ?? { name: item.name, count: 0 };
        entry.count += 1;
        leftBehind.set(item.itemId, entry);
      }
    }

    const storeTrips = new Map<string, number>();
    for (const trip of trips) {
      const key = trip.storeName ?? "No store";
      storeTrips.set(key, (storeTrips.get(key) ?? 0) + 1);
    }

    const categoryCounts = new Map<string, number>();
    for (const s of stats) {
      const key = s.category ?? "other";
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + s.timesBought);
    }

    return NextResponse.json({
      tripCount: trips.length,
      itemsBought,
      avgItemsPerTrip: trips.length ? itemsBought / trips.length : 0,
      avgTripMinutes: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null,
      topItems: [...stats]
        .sort((a, b) => b.timesBought - a.timesBought || a.name.localeCompare(b.name))
        .slice(0, 10)
        .map((s) => ({
          itemId: s.itemId,
          name: s.name,
          category: s.category,
          timesBought: s.timesBought,
          daysSinceLast: s.daysSinceLast,
          avgIntervalDays: s.avgIntervalDays,
        })),
      leftBehind: [...leftBehind.entries()]
        .map(([itemId, v]) => ({ itemId, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      stores: [...storeTrips.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      categories: [...categoryCounts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      recentTrips: trips.slice(0, 5).map((t) => ({
        listId: t.listId,
        storeName: t.storeName,
        completedAt: t.completedAt,
        checked: t.items.filter((i) => i.checked).length,
        total: t.items.length,
        minutes: tripDurationMinutes(t),
      })),
    });
  } catch (err) {
    return serverError("GET /api/insights", err);
  }
}
