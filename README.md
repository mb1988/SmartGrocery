# SmartGrocery

Mobile-first shopping lists that **learn the order you walk each store**. Tick items in Shopping
Mode, tap Done, and your next list for that store comes back sorted by your route.

## Features

- **Route learning** per user and store (running average of check-off position) — `lib/learning.ts`
- Lists with quantities, units and notes; natural-language add (`2 litres of milk`, `500g mince`)
- Voice input (Web Speech API) and barcode scanning (ZXing + Open Food Facts)
- UK product search with photos via Open Food Facts — `lib/openFoodFacts.ts`
- Shopping Mode: big tap targets, search, haptics, screen wake lock, "ignore this trip"
- "Your usuals" suggestions and an Insights page built from purchase history — `lib/history.ts`
- Store management: rename, delete, view or reset the learned route
- Template lists (e.g. "Weekly shop") — save any list as a template, start new lists from it
- Installable PWA, light/dark mode

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma 5 · PostgreSQL (Neon) · NextAuth v5 ·
next-pwa

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000. Until Google sign-in is added, all data belongs to a single dev user
(`lib/session.ts`).

## Scripts

| Command                           | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `npm run dev`                     | Dev server                             |
| `npm run build`                   | Production build                       |
| `npm run lint`                    | ESLint                                 |
| `npm run format`                  | Prettier                               |
| `node scripts/generate-icons.mjs` | Regenerate PWA icons in `public/icons` |

## API

| Method            | Path                       | Purpose                                       |
| ----------------- | -------------------------- | --------------------------------------------- |
| GET / POST        | `/api/stores`              | List / create stores                          |
| GET / PATCH / DEL | `/api/stores/:id`          | Store + learned route / rename / delete       |
| DELETE            | `/api/stores/:id/learning` | Reset learned route                           |
| GET / POST        | `/api/lists`               | Lists (`?templates=1` for templates) / create |
| GET / PATCH / DEL | `/api/lists/:id`           | Route-sorted list / rename, complete / delete |
| POST              | `/api/list-items`          | Add item (merges duplicates)                  |
| PATCH / DELETE    | `/api/list-items/:id`      | Tick, edit quantity/unit/note / remove        |
| GET               | `/api/items?search=`       | Catalogue + Open Food Facts search            |
| GET               | `/api/barcode/:code`       | Barcode lookup                                |
| GET               | `/api/suggestions?listId=` | "Your usuals" for a list                      |
| GET               | `/api/insights`            | Purchase-history stats                        |
