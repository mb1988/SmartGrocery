import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeCategory } from "@/lib/categories";
import { lookupBarcode } from "@/lib/openFoodFacts";
import { jsonError, serverError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  const barcode = params.code.trim();

  // EAN-8 / UPC-A / EAN-13 / GTIN-14 are all 8–14 digits
  if (!/^\d{8,14}$/.test(barcode)) {
    return jsonError("invalid barcode", 400);
  }

  try {
    // Check local catalogue first
    const local = await db.item.findUnique({
      where: { barcode },
      select: { id: true, name: true, category: true, imageUrl: true, barcode: true },
    });

    if (local) {
      return NextResponse.json({
        ...local,
        category: normalizeCategory(local.category, local.name),
        brand: null,
        source: "local",
      });
    }
  } catch (err) {
    return serverError("GET /api/barcode/[code]", err);
  }

  // Fall back to Open Food Facts
  try {
    const product = await lookupBarcode(barcode);
    if (!product) return jsonError("product not found", 404);
    return NextResponse.json(product);
  } catch {
    return jsonError("lookup failed", 502);
  }
}
