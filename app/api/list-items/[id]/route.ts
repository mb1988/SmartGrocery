import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const listItemId = parseInt(params.id, 10);
  if (isNaN(listItemId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  // Verify ownership via the parent list
  const listItem = await db.listItem.findFirst({
    where: { id: listItemId },
    include: { list: { select: { userId: true } } },
  });
  if (!listItem || listItem.list.userId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: {
    checked?: boolean;
    checkedOrder?: number | null;
    checkedAt?: Date | null;
    quantity?: number;
    unit?: string | null;
    note?: string | null;
  } = {};

  // Use case A — tick / untick
  if (typeof body.checked === "boolean") {
    data.checked = body.checked;
    data.checkedAt = body.checked ? new Date() : null;
    data.checkedOrder =
      body.checked && typeof body.checkedOrder === "number" ? body.checkedOrder : null;
  }

  // Use case B — edit item details
  if (typeof body.quantity === "number") data.quantity = body.quantity;
  if (typeof body.unit === "string") data.unit = body.unit.trim() || null;
  if (typeof body.note === "string") data.note = body.note.trim() || null;

  const updated = await db.listItem.update({
    where: { id: listItemId },
    data,
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

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  const listItemId = parseInt(params.id, 10);
  if (isNaN(listItemId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const listItem = await db.listItem.findFirst({
    where: { id: listItemId },
    include: { list: { select: { userId: true } } },
  });
  if (!listItem || listItem.list.userId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.listItem.delete({ where: { id: listItemId } });
  return new NextResponse(null, { status: 204 });
}
