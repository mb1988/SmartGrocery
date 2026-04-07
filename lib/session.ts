import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Cache the dev user ID for the lifetime of the process so we only hit the DB once.
let cachedDevUserId: number | null = null;

/**
 * Returns the current user's ID from the NextAuth session.
 * Dev fallback: upserts the dev user so it always exists, regardless of whether
 * `prisma db seed` has been run (e.g. on a fresh Vercel deploy or wiped DB).
 */
export async function getSessionUserId(): Promise<number> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const id = parseInt(session.user.id, 10);
      if (!isNaN(id)) return id;
    }
  } catch {
    // No valid session — fall through to dev user
  }

  if (cachedDevUserId !== null) return cachedDevUserId;

  const user = await db.user.upsert({
    where: { email: "dev@smartgrocery.local" },
    update: {},
    create: { email: "dev@smartgrocery.local", name: "Dev User" },
    select: { id: true },
  });

  cachedDevUserId = user.id;
  return user.id;
}
