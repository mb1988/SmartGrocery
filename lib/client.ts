/** Browser-side helpers shared by pages and components. */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** fetch + JSON with errors surfaced as exceptions (so callers can show a toast). */
export async function api<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

/** "Weekly shop", or "Tesco – 6 Apr" when the list has no name. */
export function listDisplayName(
  name: string | null,
  storeName: string | null | undefined,
  createdAt: string
): string {
  if (name) return name;
  const date = new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${storeName ?? "Shop"} – ${date}`;
}

export function relativeDays(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (days < 30) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/** Short vibration on supported devices (Android) — silently ignored elsewhere. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if vibration is blocked by permissions policy
  }
}
