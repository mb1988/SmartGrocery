# 08 – Build Order

> Follow these steps in sequence. Each step has a clear goal and a done check. Do not start the next step until the current one is complete and working.

---

## Phase 0 — Project Setup

### Step 1 — Initialise the Next.js Project

```
npx create-next-app@latest smartgrocery --typescript --tailwind --eslint --app --src-dir=false
cd smartgrocery
```

**Done when:** `npm run dev` opens a working page at `localhost:3000`

---

### Step 2 — Configure Prettier and ESLint

Install and configure Prettier:
```
npm install -D prettier eslint-config-prettier
```

Add `.prettierrc`:
```json
{ "semi": true, "singleQuote": true, "tabWidth": 2, "trailingComma": "all" }
```

**Done when:** Saving a file auto-formats it.

---

### Step 3 — Provision Railway PostgreSQL

1. Create account at railway.app
2. New project → Add PostgreSQL
3. Copy the `DATABASE_URL` connection string
4. Create `.env.local` with `DATABASE_URL=<your-connection-string>`

**Done when:** You can connect to the DB with a Postgres client (e.g. TablePlus, DBeaver, or `psql`).

---

### Step 4 — Set Up Prisma

```
npm install prisma @prisma/client
npx prisma init
```

Replace `prisma/schema.prisma` with the full schema from `02_database_schema.md`.

Run first migration:
```
npx prisma migrate dev --name init
```

**Done when:** `npx prisma studio` opens the browser and shows all empty tables.

---

### Step 5 — Create Prisma Client Singleton

Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

**Done when:** You can import `db` from anywhere and run a query without "too many connections" errors.

---

### Step 6 — Seed the Database (Dev Only)

Create `prisma/seed.ts` that inserts:
- 1 user (your dev user)
- 2 stores (e.g. Tesco, Lidl)
- 10 common grocery items

Add to `package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

Run: `npx prisma db seed`

**Done when:** You can see the seeded data in Prisma Studio.

---

## Phase 1 — API Layer

### Step 7 — Stores API

Build:
- `GET /api/stores`
- `POST /api/stores`

Test with a REST client (e.g. Thunder Client VS Code extension) — no UI needed yet.

**Done when:** `GET /api/stores` returns seeded stores as JSON.

---

### Step 8 — Items API

Build:
- `GET /api/items?search=` (with case-insensitive LIKE query)
- `POST /api/items` (with lowercase normalisation)

**Done when:** `GET /api/items?search=mil` returns milk, milkshake, etc.

---

### Step 9 — Lists API

Build:
- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/:id`
- `PATCH /api/lists/:id`

**Done when:** You can create a list and fetch it with all fields.

---

### Step 10 — List Items API

Build:
- `POST /api/list-items`
- `PATCH /api/list-items/:id`
- `DELETE /api/list-items/:id`

**Done when:** You can add items, tick them with `checkedOrder`, and delete them via API.

---

### Step 11 — Learning System

Create `lib/learning.ts` with:
- `updateLearning(userId, storeId, listId)` — reads checked items, updates `store_item_order`
- `getSortedItemIds(userId, storeId, itemIds)` — returns item IDs sorted by `avg_order`

Wire `updateLearning` into `PATCH /api/lists/:id` when `completed: true`.

**Done when:** After marking a list complete via API, you can see updated `avg_order` rows in Prisma Studio.

---

## Phase 2 — UI

### Step 12 — Home Page (`/lists`)

Build the list of all lists (empty state + list cards). No real data needed — mock the API call first, then connect.

**Done when:** Lists from the API appear as cards on the home page.

---

### Step 13 — Create List Flow

Add the "New List" button. Build the `StorePickerModal` bottom sheet. On selection, POST to `/api/lists` and redirect to the new list.

**Done when:** You can go from home to store picker to new list in one flow.

---

### Step 14 — List Detail Page (`/lists/:id`)

Build the `AddItemBar` with autocomplete (queries `/api/items?search=`). Show items below. Allow removing items.

**Done when:** You can add 3 items to a list and see them in the list.

---

### Step 15 — Shopping Mode (`/shop/:id`)

Build the full-screen shopping UI. Large buttons. Ticking moves item to the checked section. "Done Shopping" button sends PATCH to mark list complete.

**Done when:** You can tick all items and tap "Done Shopping" — list is marked complete in the DB and learning rows are updated.

---

## Phase 3 — Integration & Validation

### Step 16 — End-to-End Test (Manual)

Run through the full MVP acceptance criteria from `06_mvp_scope.md` manually. Both trips, on a real mobile browser.

**Done when:** Learning visibly reorders the list on the second trip.

---

### Step 17 — Deploy to Vercel

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Done when:** The full app is accessible at your Vercel URL on a real phone.

---

## Summary Table

| Phase | Steps | Goal |
|---|---|---|
| 0 – Setup | 1–6 | Project runs, DB connected, seeded |
| 1 – API | 7–11 | All endpoints work and learning fires |
| 2 – UI | 12–15 | Full app usable in browser |
| 3 – Ship | 16–17 | Validated and deployed |

---

## Tips

- Build each API step before its UI step — test with Thunder Client or curl
- Commit after each step completes
- Keep the learning algorithm logic in `lib/learning.ts` isolated — don't mix it into route handlers
- Run `npx prisma studio` constantly while building — it's the fastest way to debug data issues
