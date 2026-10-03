import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { jsonError, parseId, parseQuantity, readJson, serverError } from "@/lib/api";

async function findOwnedListItem(listItemId: number, userId: number) {
  const listItem = await db.listItem.findFirst({
    where: { id: listItemId },
    include: { list: { select: { userId: true } } },
  });
  return listItem && listItem.list.userId === userId ? listItem : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const listItemId = parseId(params.id);
    if (!listItemId) return jsonError("invalid id", 400);

    // Verify ownership via the parent list
    if (!(await findOwnedListItem(listItemId, userId))) return jsonError("not found", 404);

    const body = await readJson(request);
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
    if (body.quantity !== undefined) {
      const quantity = parseQuantity(body.quantity);
      if (quantity === null) return jsonError("quantity must be a positive number", 400);
      data.quantity = quantity;
    }
    if (typeof body.unit === "string") data.unit = body.unit.trim().slice(0, 20) || null;
    if (typeof body.note === "string") data.note = body.note.trim().slice(0, 120) || null;

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
  } catch (err) {
    return serverError("PATCH /api/list-items/[id]", err);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const listItemId = parseId(params.id);
    if (!listItemId) return jsonError("invalid id", 400);

    if (!(await findOwnedListItem(listItemId, userId))) return jsonError("not found", 404);

    await db.listItem.delete({ where: { id: listItemId } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return serverError("DELETE /api/list-items/[id]", err);
  }
}
