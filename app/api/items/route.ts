import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface OFFProduct {
  product_name?: string;
  brands?: string;
  image_thumb_url?: string;
  code?: string;
  categories_tags?: string[];
}

interface OFFResponse {
  products?: OFFProduct[];
}

export interface ItemSearchResult {
  id: number | null;
  name: string;
  category: string | null;
  imageUrl: string | null;
  barcode: string | null;
  brand: string | null;
  source: "local" | "off";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    if (!search) {
      return NextResponse.json([]);
    }

    // Local catalogue first
    const localItems = await db.item.findMany({
      where: {
        name: { contains: search.toLowerCase(), mode: "insensitive" },
      },
      select: { id: true, name: true, category: true, imageUrl: true, barcode: true },
      take: 10,
      orderBy: { name: "asc" },
    });

    const results: ItemSearchResult[] = localItems.map((item) => ({
      ...item,
      brand: null,
      source: "local" as const,
    }));

    const seen = new Set(results.map((r) => r.name.toLowerCase()));

    // Augment with Open Food Facts UK products
    try {
      const offUrl =
        `https://world.openfoodfacts.org/api/v2/search` +
        `?search_terms=${encodeURIComponent(search)}` +
        `&countries_tags=en:united-kingdom` +
        `&page_size=6` +
        `&fields=product_name,brands,image_thumb_url,code,categories_tags` +
        `&search_simple=1`;

      const offRes = await fetch(offUrl, {
        headers: { "User-Agent": "SmartGrocery/1.0" },
        signal: AbortSignal.timeout(4000),
      });

      if (offRes.ok) {
        const offData: OFFResponse = await offRes.json();
        for (const product of offData.products ?? []) {
          const name = product.product_name?.trim().toLowerCase();
          if (!name || seen.has(name)) continue;

          // Pick the most specific English category tag
          const enTag = (product.categories_tags ?? []).filter((t) => t.startsWith("en:")).at(-1);
          const category = enTag ? enTag.replace("en:", "").replace(/-/g, " ") : null;

          results.push({
            id: null,
            name,
            category,
            imageUrl: product.image_thumb_url ?? null,
            barcode: product.code ?? null,
            brand: product.brands?.split(",")[0].trim() ?? null,
            source: "off",
          });
          seen.add(name);
        }
      }
    } catch {
      // OFF timeout or error — serve local results only
    }

    return NextResponse.json(results);
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
