import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { jsonError, optionalString, parseId, readJson, serverError } from "@/lib/api";

/** Returns the store plus its learned route (items in the order the user walks them). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const storeId = parseId(params.id);
    if (!storeId) return jsonError("invalid id", 400);

    const store = await db.store.findFirst({
      where: { id: storeId, userId },
      select: { id: true, name: true, address: true },
    });
    if (!store) return jsonError("not found", 404);

    const [route, tripCount] = await Promise.all([
      db.storeItemOrder.findMany({
        where: { userId, storeId },
        orderBy: { avgOrder: "asc" },
        select: {
          avgOrder: true,
          timesSeen: true,
          lastSeen: true,
          item: { select: { id: true, name: true, category: true } },
        },
      }),
      db.list.count({ where: { userId, storeId, completedAt: { not: null } } }),
    ]);

    return NextResponse.json({
      ...store,
      tripCount,
      route: route.map((r) => ({
        itemId: r.item.id,
        name: r.item.name,
        avgOrder: r.avgOrder,
        timesSeen: r.timesSeen,
        lastSeen: r.lastSeen,
      })),
    });
  } catch (err) {
    return serverError("GET /api/stores/[id]", err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const storeId = parseId(params.id);
    if (!storeId) return jsonError("invalid id", 400);

    const existing = await db.store.findFirst({ where: { id: storeId, userId } });
    if (!existing) return jsonError("not found", 404);

    const body = await readJson(request);
    const data: { name?: string; address?: string | null } = {};
    if (typeof body.name === "string") {
      const name = optionalString(body.name, 60);
      if (!name) return jsonError("name cannot be empty", 400);
      data.name = name;
    }
    if (typeof body.address === "string") data.address = optionalString(body.address, 120);

    const store = await db.store.update({
      where: { id: storeId },
      data,
      select: { id: true, name: true, address: true },
    });
    return NextResponse.json(store);
  } catch (err) {
    return serverError("PATCH /api/stores/[id]", err);
  }
}

/** Deletes a store and its learned route. Lists keep their items but lose the store link. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const storeId = parseId(params.id);
    if (!storeId) return jsonError("invalid id", 400);

    const existing = await db.store.findFirst({ where: { id: storeId, userId } });
    if (!existing) return jsonError("not found", 404);

    await db.$transaction([
      db.storeItemOrder.deleteMany({ where: { storeId } }),
      db.list.updateMany({ where: { storeId }, data: { storeId: null } }),
      db.store.delete({ where: { id: storeId } }),
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return serverError("DELETE /api/stores/[id]", err);
  }
}
