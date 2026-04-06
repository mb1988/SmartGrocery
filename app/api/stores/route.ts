import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();

  const stores = await db.store.findMany({
    where: { userId },
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(stores);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const store = await db.store.create({
    data: {
      name,
      address: typeof body.address === "string" ? body.address.trim() || null : null,
      userId,
    },
    select: { id: true, name: true, address: true, createdAt: true },
  });

  return NextResponse.json(store, { status: 201 });
}
