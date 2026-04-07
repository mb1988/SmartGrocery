import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface OFFProduct {
  product_name?: string;
  brands?: string;
  image_thumb_url?: string;
  categories_tags?: string[];
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  const barcode = params.code.trim();

  if (!barcode) {
    return NextResponse.json({ error: "barcode is required" }, { status: 400 });
  }

  // Check local catalogue first
  const local = await db.item.findUnique({
    where: { barcode },
    select: { id: true, name: true, category: true, imageUrl: true, barcode: true },
  });

  if (local) {
    return NextResponse.json({ ...local, brand: null, source: "local" });
  }

  // Fall back to Open Food Facts
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}` +
        `?fields=product_name,brands,image_thumb_url,categories_tags`,
      {
        headers: { "User-Agent": "SmartGrocery/1.0" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!offRes.ok) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    const data: OFFResponse = await offRes.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    const p = data.product;
    const name = p.product_name?.trim().toLowerCase() ?? null;

    if (!name) {
      return NextResponse.json({ error: "product has no name" }, { status: 404 });
    }

    const enTag = (p.categories_tags ?? []).filter((t) => t.startsWith("en:")).at(-1);
    const category = enTag ? enTag.replace("en:", "").replace(/-/g, " ") : null;

    return NextResponse.json({
      id: null,
      name,
      category,
      imageUrl: p.image_thumb_url ?? null,
      barcode,
      brand: p.brands?.split(",")[0].trim() ?? null,
      source: "off",
    });
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
