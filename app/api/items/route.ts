import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeCategory } from "@/lib/categories";
import { searchProducts, type ProductResult } from "@/lib/openFoodFacts";
import { jsonError, optionalString, readJson, serverError } from "@/lib/api";

export type ItemSearchResult = ProductResult;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase().slice(0, 80) ?? "";

    if (!search) {
      return NextResponse.json([]);
    }

    // Local catalogue first, OFF in parallel so slow lookups don't stack
    const [localItems, offResults] = await Promise.all([
      db.item.findMany({
        where: { name: { contains: search, mode: "insensitive" } },
        select: { id: true, name: true, category: true, imageUrl: true, barcode: true },
        take: 20,
      }),
      // OFF only adds value once there's something meaningful to search for
      search.length >= 3 ? searchProducts(search).catch(() => []) : Promise.resolve([]),
    ]);

    // Prefix matches first ("milk" before "buttermilk"), then shorter names
    localItems.sort((a, b) => {
      const aPrefix = a.name.startsWith(search) ? 0 : 1;
      const bPrefix = b.name.startsWith(search) ? 0 : 1;
      return aPrefix - bPrefix || a.name.length - b.name.length || a.name.localeCompare(b.name);
    });

    const results: ItemSearchResult[] = localItems.slice(0, 8).map((item) => ({
      ...item,
      category: normalizeCategory(item.category, item.name),
      brand: null,
      source: "local" as const,
    }));

    const seen = new Set(results.map((r) => r.name));
    for (const product of offResults) {
      if (seen.has(product.name)) continue;
      results.push(product);
      seen.add(product.name);
    }

    return NextResponse.json(results);
  } catch (err) {
    return serverError("GET /api/items", err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const name = optionalString(body.name, 120)?.toLowerCase() ?? "";
    if (!name) return jsonError("name is required", 400);

    // Upsert: if already exists return existing item (200), else create
    const item = await db.item.upsert({
      where: { name },
      update: {},
      create: { name, category: normalizeCategory(optionalString(body.category), name) },
      select: { id: true, name: true, category: true },
    });

    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    return serverError("POST /api/items", err);
  }
}
