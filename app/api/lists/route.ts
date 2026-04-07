import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const lists = await db.list.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        storeId: true,
        store: { select: { name: true } },
        createdAt: true,
        completedAt: true,
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(
      lists.map((l: (typeof lists)[number]) => ({
        id: l.id,
        name: l.name,
        storeId: l.storeId,
        storeName: l.store?.name ?? null,
        createdAt: l.createdAt,
        completedAt: l.completedAt,
        itemCount: l._count.items,
      }))
    );
  } catch (err) {
    console.error("GET /api/lists error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await request.json();
    const storeId = typeof body.storeId === "number" ? body.storeId : null;
    const name = typeof body.name === "string" ? body.name.trim() || null : null;
    const cloneFromListId = typeof body.cloneFromListId === "number" ? body.cloneFromListId : null;

    // Optionally clone items from a previous list
    let clonedItems: {
      itemId: number;
      quantity: number;
      unit: string | null;
      note: string | null;
    }[] = [];
    if (cloneFromListId) {
      clonedItems = await db.listItem.findMany({
        where: { listId: cloneFromListId },
        select: { itemId: true, quantity: true, unit: true, note: true },
      });
    }

    const list = await db.list.create({
      data: {
        userId,
        storeId,
        name,
        items: clonedItems.length > 0 ? { create: clonedItems } : undefined,
      },
      select: {
        id: true,
        name: true,
        storeId: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (err) {
    console.error("POST /api/lists error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
