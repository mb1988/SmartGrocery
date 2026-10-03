import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { jsonError, optionalString, readJson, serverError } from "@/lib/api";

// Per-user data — never prerender at build time
export const dynamic = "force-dynamic";

/** GET /api/lists — shopping lists; GET /api/lists?templates=1 — saved templates only. */
export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    const isTemplate = new URL(request.url).searchParams.get("templates") === "1";

    const [lists, checkedCounts] = await Promise.all([
      db.list.findMany({
        where: { userId, isTemplate },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          storeId: true,
          store: { select: { name: true } },
          createdAt: true,
          completedAt: true,
          _count: { select: { items: true } },
          items: {
            take: 4,
            orderBy: { id: "asc" },
            select: { item: { select: { name: true } } },
          },
        },
      }),
      db.listItem.groupBy({
        by: ["listId"],
        where: { checked: true, list: { userId, isTemplate } },
        _count: { _all: true },
      }),
    ]);

    const checkedMap = new Map(checkedCounts.map((c) => [c.listId, c._count._all]));

    return NextResponse.json(
      lists.map((l) => ({
        id: l.id,
        name: l.name,
        storeId: l.storeId,
        storeName: l.store?.name ?? null,
        createdAt: l.createdAt,
        completedAt: l.completedAt,
        isTemplate,
        itemCount: l._count.items,
        checkedCount: checkedMap.get(l.id) ?? 0,
        preview: l.items.map((li) => li.item.name),
      }))
    );
  } catch (err) {
    return serverError("GET /api/lists", err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await readJson(request);
    const storeId = typeof body.storeId === "number" ? body.storeId : null;
    const isTemplate = body.isTemplate === true;
    // Templates are found by name, so they always need one
    const name = optionalString(body.name, 80) ?? (isTemplate ? "My template" : null);
    const cloneFromListId = typeof body.cloneFromListId === "number" ? body.cloneFromListId : null;

    // Never trust IDs from the client — the store and source list must belong to this user
    if (storeId !== null) {
      const store = await db.store.findFirst({ where: { id: storeId, userId } });
      if (!store) return jsonError("store not found", 404);
    }

    // Optionally clone items from a previous list
    let clonedItems: {
      itemId: number;
      quantity: number;
      unit: string | null;
      note: string | null;
    }[] = [];
    if (cloneFromListId) {
      const source = await db.list.findFirst({ where: { id: cloneFromListId, userId } });
      if (!source) return jsonError("source list not found", 404);
      clonedItems = await db.listItem.findMany({
        where: { listId: cloneFromListId },
        orderBy: { id: "asc" },
        select: { itemId: true, quantity: true, unit: true, note: true },
      });
    }

    const list = await db.list.create({
      data: {
        userId,
        storeId,
        name,
        isTemplate,
        items: clonedItems.length > 0 ? { create: clonedItems } : undefined,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        createdAt: true,
        completedAt: true,
        isTemplate: true,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (err) {
    return serverError("POST /api/lists", err);
  }
}
