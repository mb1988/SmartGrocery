import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await request.json();
    const listId = typeof body.listId === "number" ? body.listId : NaN;
    const itemName = typeof body.itemName === "string" ? body.itemName.trim().toLowerCase() : "";

    if (isNaN(listId) || !itemName) {
      return NextResponse.json({ error: "listId and itemName are required" }, { status: 400 });
    }

    // Verify the list belongs to this user
    const list = await db.list.findFirst({ where: { id: listId, userId } });
    if (!list) {
      return NextResponse.json({ error: "list not found" }, { status: 404 });
    }

    // Upsert the item in the global catalogue
    const item = await db.item.upsert({
      where: { name: itemName },
      update: {},
      create: {
        name: itemName,
        category:
          typeof body.category === "string" ? body.category.trim().toLowerCase() || null : null,
      },
    });

    const listItem = await db.listItem.create({
      data: {
        listId,
        itemId: item.id,
        quantity: typeof body.quantity === "number" ? body.quantity : 1,
        unit: typeof body.unit === "string" ? body.unit.trim() || null : null,
        note: typeof body.note === "string" ? body.note.trim() || null : null,
      },
      select: {
        id: true,
        listId: true,
        itemId: true,
        quantity: true,
        unit: true,
        checked: true,
        checkedOrder: true,
        checkedAt: true,
        note: true,
      },
    });

    return NextResponse.json(listItem, { status: 201 });
  } catch (err) {
    console.error("POST /api/list-items error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
