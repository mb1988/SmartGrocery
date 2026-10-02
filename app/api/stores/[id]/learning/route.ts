import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { resetLearning } from "@/lib/learning";
import { jsonError, parseId, serverError } from "@/lib/api";

/** Reset the learned route for a store (_plan/07_backlog.md → Learning System Improvements). */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getSessionUserId();
    const storeId = parseId(params.id);
    if (!storeId) return jsonError("invalid id", 400);

    const store = await db.store.findFirst({ where: { id: storeId, userId } });
    if (!store) return jsonError("not found", 404);

    const removed = await resetLearning(userId, storeId);
    return NextResponse.json({ removed });
  } catch (err) {
    return serverError("DELETE /api/stores/[id]/learning", err);
  }
}
