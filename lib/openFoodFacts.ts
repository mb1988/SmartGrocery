/**
 * openFoodFacts.ts — Open Food Facts client (free, open licence, no key).
 *
 * Search uses OFF's Search-a-licious API: the older /api/v2/search endpoint
 * silently ignores `search_terms` and returns unrelated products.
 * Barcode lookups use the stable /api/v2/product endpoint.
 */

import { normalizeCategory } from "@/lib/categories";

const USER_AGENT = "SmartGrocery/1.0 (https://github.com/mb1988/SmartGrocery)";

export interface ProductResult {
  id: number | null;
  name: string;
  category: string | null;
  imageUrl: string | null;
  barcode: string | null;
  brand: string | null;
  source: "local" | "off";
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  image_thumb_url?: string;
  image_front_thumb_url?: string;
  categories_tags?: string[];
}

function firstBrand(brands: OFFProduct["brands"]): string | null {
  const first = Array.isArray(brands) ? brands[0] : brands?.split(",")[0];
  return first?.trim() || null;
}

function toResult(p: OFFProduct, barcode?: string): ProductResult | null {
  const name = p.product_name?.trim().toLowerCase();
  if (!name) return null;

  // Most specific English tag first, then fall back through broader ones
  const enTags = (p.categories_tags ?? [])
    .filter((t) => t.startsWith("en:"))
    .map((t) => t.slice(3).replace(/-/g, " "))
    .reverse();
  const category =
    enTags.map((t) => normalizeCategory(t)).find(Boolean) ?? normalizeCategory(null, name);

  return {
    id: null,
    name,
    category,
    imageUrl: p.image_front_thumb_url ?? p.image_thumb_url ?? null,
    barcode: barcode ?? p.code ?? null,
    brand: firstBrand(p.brands),
    source: "off",
  };
}

export async function searchProducts(query: string, limit = 6): Promise<ProductResult[]> {
  const q = `${query} countries_tags:"en:united-kingdom"`;
  const url =
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}` +
    `&page_size=${limit}` +
    `&fields=code,product_name,brands,image_thumb_url,image_front_thumb_url,categories_tags`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(4000),
    // Product data changes rarely — let Next cache identical searches for a day
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];

  const data: { hits?: OFFProduct[] } = await res.json();
  return (data.hits ?? []).map((p) => toResult(p)).filter((r): r is ProductResult => !!r);
}

export async function lookupBarcode(barcode: string): Promise<ProductResult | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}` +
      `?fields=product_name,brands,image_thumb_url,image_front_thumb_url,categories_tags`,
    {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    }
  );
  if (!res.ok) return null;

  const data: { status: number; product?: OFFProduct } = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return toResult(data.product, barcode);
}
