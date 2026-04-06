# 01 – Tech Stack

> This document defines the chosen technology for SmartGrocery and explains why each choice was made.

---

## Recommended Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, SSR, API routes, great ecosystem |
| Styling | TailwindCSS | Utility-first, fast for mobile-first UI |
| Database | PostgreSQL on Railway | Free tier, reliable, fits relational model |
| ORM | Prisma | Type-safe queries, schema-as-code, migrations built in |
| Auth | NextAuth.js (v5) | Easy to wire up, supports OAuth + email |
| Deployment | Vercel | Native Next.js support, free tier, zero-config |

---

## Why Not Something Simpler?

### Why Prisma over raw SQL?

You have a non-trivial schema with several foreign keys and a learning calculation that touches multiple tables. Raw SQL will become messy fast. Prisma gives you:

- Auto-completion on queries
- Migration files that are version-controlled
- A visualiser (`prisma studio`) for debugging data

### Why NextAuth from the start?

The original plan defers auth to post-MVP. This is acceptable for local dev, but skipping auth entirely means your schema has no `user_id` on learning data (see `09_recommendations.md`). Installing NextAuth early and using a single "guest" session costs almost nothing and avoids a painful retrofit later.

### Why not Supabase?

Supabase is a valid alternative. It would give you auth, realtime subscriptions, and a hosted Postgres all in one. The trade-off is less control and a tighter vendor lock. Stick with Railway + Prisma unless you want realtime features (like shared lists updating live) — in that case, switch to Supabase.

---

## Mobile Strategy

The original plan uses Next.js with mobile-first TailwindCSS. This is correct for MVP. Do **not** build a React Native app until you have validated the concept.

**Recommended path:**
1. MVP: Next.js PWA (mobile-first web)
2. Post-validation: Wrap with Capacitor or build React Native if app store presence is needed

**PWA additions to NextJS (simple, high value):**

- `next-pwa` package — adds service worker, installable icon, offline shell
- `manifest.json` — name, icon, theme colour, standalone display mode

This gives a near-native feel without a second codebase.

---

## Folder Structure (Recommended)

```
smartgrocery/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login / register pages
│   ├── lists/              # List management pages
│   ├── shop/[listId]/      # Shopping mode
│   └── api/                # API route handlers
├── components/             # Reusable UI components
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── learning.ts         # Learning algorithm logic
│   └── auth.ts             # NextAuth config
├── prisma/
│   ├── schema.prisma       # Data model
│   └── migrations/         # Auto-generated migration files
└── public/                 # Static assets, PWA manifest
```

---

## Environment Variables Needed

```env
DATABASE_URL=          # Railway PostgreSQL connection string
NEXTAUTH_SECRET=       # Random string (openssl rand -base64 32)
NEXTAUTH_URL=          # http://localhost:3000 (dev) / production URL
```

---

## Development Tools

| Tool | Purpose |
|---|---|
| `prisma studio` | Visual DB explorer — run `npx prisma studio` |
| `Railway CLI` | Manage DB from terminal |
| `Prettier` + `ESLint` | Code formatting — configure on day one |
| `Husky` | Pre-commit hooks (lint + format on save) |
