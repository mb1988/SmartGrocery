import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { jsonError, optionalString, readJson, serverError } from "@/lib/api";

// Per-user data — never prerender at build time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const stores = await db.store.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        address: true,
        _count: { select: { lists: true, learning: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      stores.map(({ _count, ...s }) => ({
        ...s,
        listCount: _count.lists,
        learnedCount: _count.learning,
      }))
    );
  } catch (err) {
    return serverError("GET /api/stores", err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await readJson(request);
    const name = optionalString(body.name, 60) ?? "";
    if (!name) return jsonError("name is required", 400);

    // Re-use an existing store with the same name instead of creating a twin
    const existing = await db.store.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true, address: true, createdAt: true },
    });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const store = await db.store.create({
      data: {
        name,
        address: optionalString(body.address, 120),
        userId,
      },
      select: { id: true, name: true, address: true, createdAt: true },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (err) {
    return serverError("POST /api/stores", err);
  }
}
