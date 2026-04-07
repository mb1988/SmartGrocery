import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    if (!search) {
      return NextResponse.json([]);
    }

    const items = await db.item.findMany({
      where: {
        name: { contains: search.toLowerCase(), mode: "insensitive" },
      },
      select: { id: true, name: true, category: true },
      take: 20,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("GET /api/items error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const category =
      typeof body.category === "string" ? body.category.trim().toLowerCase() || null : null;

    // Upsert: if already exists return existing item (200), else create
    const item = await db.item.upsert({
      where: { name },
      update: {},
      create: { name, category },
      select: { id: true, name: true, category: true },
    });

    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    console.error("POST /api/items error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
