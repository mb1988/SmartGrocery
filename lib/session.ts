import { auth } from "@/lib/auth";

/**
 * Returns the current user's ID from the NextAuth session.
 * MVP fallback: returns dev user ID (1) when no session exists.
 * Replace the fallback with an auth guard before going to production.
 */
export async function getSessionUserId(): Promise<number> {
  const session = await auth();
  if (session?.user?.id) {
    const id = parseInt(session.user.id, 10);
    if (!isNaN(id)) return id;
  }
  return 1; // dev user — seeded in prisma/seed.ts
}
