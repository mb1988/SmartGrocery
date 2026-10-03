import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getLearnedOrder, sortByLearnedOrder, updateLearning } from "@/lib/learning";
import { normalizeCategory } from "@/lib/categories";
import { jsonError, parseId, readJson, serverError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const listId = parseId(params.id);
    if (!listId) return jsonError("invalid id", 400);

    const list = await db.list.findFirst({
      where: { id: listId, userId },
      include: {
        store: { select: { id: true, name: true } },
        items: {
          orderBy: { id: "asc" },
          include: {
            item: { select: { id: true, name: true, category: true, imageUrl: true } },
          },
        },
      },
    });

    if (!list) return jsonError("not found", 404);

    const items = list.items.map((li) => ({
      listItemId: li.id,
      itemId: li.item.id,
      name: li.item.name,
      category: normalizeCategory(li.item.category, li.item.name),
      imageUrl: li.item.imageUrl,
      quantity: li.quantity,
      unit: li.unit,
      checked: li.checked,
      checkedOrder: li.checkedOrder,
      note: li.note,
      learned: false,
    }));

    // Sort items by learned route order; unknown items go last, alphabetically
    let sortedItems = items;
    let learnedCount = 0;
    if (list.storeId) {
      const avgMap = await getLearnedOrder(
        userId,
        list.storeId,
        items.map((i) => i.itemId)
      );
      sortedItems = sortByLearnedOrder(items, avgMap).map((i) => ({
        ...i,
        learned: avgMap.has(i.itemId),
      }));
      learnedCount = sortedItems.filter((i) => i.learned).length;
    }

    return NextResponse.json({
      id: list.id,
      name: list.name,
      store: list.store,
      createdAt: list.createdAt,
      completedAt: list.completedAt,
      isTemplate: list.isTemplate,
      learnedCount,
      items: sortedItems,
    });
  } catch (err) {
    return serverError("GET /api/lists/[id]", err);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const listId = parseId(params.id);
    if (!listId) return jsonError("invalid id", 400);

    const existing = await db.list.findFirst({ where: { id: listId, userId } });
    if (!existing) return jsonError("not found", 404);

    const body = await readJson(request);
    // Templates are reusable — they're copied into a new list, never shopped themselves
    if (body.completed === true && existing.isTemplate) {
      return jsonError("templates can't be completed", 409);
    }

    const data: { name?: string | null; completedAt?: Date } = {};

    if (typeof body.name === "string") {
      // Empty name resets to the default "<Store> – <date>" label
      data.name = body.name.trim().slice(0, 80) || null;
    }
    // Only set completedAt if not already completed
    const completing = body.completed === true && !existing.completedAt;
    if (completing) data.completedAt = new Date();

    const list = await db.list.update({
      where: { id: listId },
      data,
      select: {
        id: true,
        name: true,
        storeId: true,
        createdAt: true,
        completedAt: true,
        isTemplate: true,
      },
    });

    // Fire learning update only when completing a list that has a store, unless the
    // user chose "Ignore this trip" (shopping out of their usual routine).
    if (completing && existing.storeId && body.skipLearning !== true) {
      await updateLearning(userId, existing.storeId, listId);
    }

    return NextResponse.json(list);
  } catch (err) {
    return serverError("PATCH /api/lists/[id]", err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const listId = parseId(params.id);
    if (!listId) return jsonError("invalid id", 400);

    const existing = await db.list.findFirst({ where: { id: listId, userId } });
    if (!existing) return jsonError("not found", 404);

    // ListItem → List is ON DELETE RESTRICT, so remove the items first
    await db.$transaction([
      db.listItem.deleteMany({ where: { listId } }),
      db.list.delete({ where: { id: listId } }),
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return serverError("DELETE /api/lists/[id]", err);
  }
}
