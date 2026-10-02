import { NextResponse } from "next/server";

/** Parses a numeric route param; returns null if it isn't a positive integer. */
export function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 && String(id) === raw.trim() ? id : null;
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Logs and returns a generic 500 — keeps route handlers' catch blocks one line. */
export function serverError(label: string, err: unknown) {
  console.error(`${label} error:`, err);
  return jsonError("Internal server error", 500);
}

/** Reads a JSON body, returning {} for an empty or malformed body. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/** A positive, finite quantity rounded to 2dp, or null if invalid. */
export function parseQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 9999) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function optionalString(value: unknown, maxLength = 200): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, maxLength) || null;
}
