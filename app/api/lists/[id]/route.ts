import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getSortedItemIds, updateLearning } from "@/lib/learning";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const listId = parseInt(params.id, 10);
  if (isNaN(listId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const list = await db.list.findFirst({
    where: { id: listId, userId },
    include: {
      store: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });

  if (!list) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Sort items by learned order; fall back to alphabetical for unknowns
  let sortedItems = list.items;
  if (list.storeId) {
    const itemIds = list.items.map((li) => li.itemId);
    const ordered = await getSortedItemIds(userId, list.storeId, itemIds);
    const orderMap = new Map(ordered.map((id, i) => [id, i]));
    sortedItems = [...list.items].sort(
      (a, b) => (orderMap.get(a.itemId) ?? 999) - (orderMap.get(b.itemId) ?? 999)
    );
  }

  return NextResponse.json({
    id: list.id,
    name: list.name,
    store: list.store,
    createdAt: list.createdAt,
    completedAt: list.completedAt,
    items: sortedItems.map((li) => ({
      listItemId: li.id,
      itemId: li.item.id,
      name: li.item.name,
      category: li.item.category,
      quantity: li.quantity,
      unit: li.unit,
      checked: li.checked,
      checkedOrder: li.checkedOrder,
      note: li.note,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const listId = parseInt(params.id, 10);
  if (isNaN(listId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await db.list.findFirst({ where: { id: listId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: { name?: string; completedAt?: Date } = {};

  if (typeof body.name === "string") {
    data.name = body.name.trim();
  }
  // Only set completedAt if not already completed
  if (body.completed === true && !existing.completedAt) {
    data.completedAt = new Date();
  }

  const list = await db.list.update({
    where: { id: listId },
    data,
    select: {
      id: true,
      name: true,
      storeId: true,
      createdAt: true,
      completedAt: true,
    },
  });

  // Fire learning update only when completing a list that has a store
  if (body.completed === true && !existing.completedAt && existing.storeId) {
    await updateLearning(userId, existing.storeId, listId);
  }

  return NextResponse.json(list);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const listId = parseInt(params.id, 10);
  if (isNaN(listId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await db.list.findFirst({ where: { id: listId, userId } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.list.delete({ where: { id: listId } });
  return new NextResponse(null, { status: 204 });
}
