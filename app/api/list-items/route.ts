import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { normalizeCategory } from "@/lib/categories";
import { jsonError, optionalString, parseQuantity, readJson, serverError } from "@/lib/api";

const LIST_ITEM_SELECT = {
  id: true,
  listId: true,
  itemId: true,
  quantity: true,
  unit: true,
  checked: true,
  checkedOrder: true,
  checkedAt: true,
  note: true,
} as const;

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await readJson(request);
    const listId = typeof body.listId === "number" ? body.listId : NaN;
    const itemName = optionalString(body.itemName, 120)?.toLowerCase() ?? "";

    if (isNaN(listId) || !itemName) {
      return jsonError("listId and itemName are required", 400);
    }

    // Verify the list belongs to this user
    const list = await db.list.findFirst({ where: { id: listId, userId } });
    if (!list) return jsonError("list not found", 404);
    if (list.completedAt) return jsonError("list is already completed", 409);

    const quantity = parseQuantity(body.quantity) ?? 1;
    const unit = optionalString(body.unit, 20);
    const note = optionalString(body.note, 120);
    const imageUrl = optionalString(body.imageUrl, 500);
    let barcode = optionalString(body.barcode, 32);

    // Barcode is unique — don't steal it from a different catalogue item
    if (barcode) {
      const owner = await db.item.findUnique({ where: { barcode }, select: { name: true } });
      if (owner && owner.name !== itemName) barcode = null;
    }

    // Upsert the item in the global catalogue; enrich barcode/imageUrl from OFF if supplied
    const item = await db.item.upsert({
      where: { name: itemName },
      update: {
        ...(barcode ? { barcode } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
      create: {
        name: itemName,
        category: normalizeCategory(optionalString(body.category), itemName),
        barcode,
        imageUrl,
      },
    });

    // Already on the list (and not yet ticked)? Bump the quantity instead of duplicating.
    const duplicate = await db.listItem.findFirst({
      where: { listId, itemId: item.id, checked: false },
    });
    if (duplicate && (duplicate.unit ?? null) === unit) {
      const merged = await db.listItem.update({
        where: { id: duplicate.id },
        data: {
          quantity: Math.round((duplicate.quantity + quantity) * 100) / 100,
          ...(note ? { note } : {}),
        },
        select: LIST_ITEM_SELECT,
      });
      return NextResponse.json({ ...merged, merged: true }, { status: 200 });
    }

    const listItem = await db.listItem.create({
      data: { listId, itemId: item.id, quantity, unit, note },
      select: LIST_ITEM_SELECT,
    });

    return NextResponse.json({ ...listItem, merged: false }, { status: 201 });
  } catch (err) {
    return serverError("POST /api/list-items", err);
  }
}
