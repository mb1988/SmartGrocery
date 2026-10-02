import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getItemStats, getSuggestions, getTrips } from "@/lib/history";
import { jsonError, parseId, serverError } from "@/lib/api";

// Per-user data — never prerender at build time
export const dynamic = "force-dynamic";

/** GET /api/suggestions?listId=5 — regular buys that aren't on this list yet. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    const listId = parseId(new URL(request.url).searchParams.get("listId") ?? "");
    if (!listId) return jsonError("listId is required", 400);

    const list = await db.list.findFirst({
      where: { id: listId, userId },
      select: { storeId: true, items: { select: { itemId: true } } },
    });
    if (!list) return jsonError("list not found", 404);

    const trips = await getTrips(userId);
    const suggestions = getSuggestions(
      getItemStats(trips),
      new Set(list.items.map((i) => i.itemId)),
      trips.length,
      list.storeId
    );

    return NextResponse.json(suggestions);
  } catch (err) {
    return serverError("GET /api/suggestions", err);
  }
}
