# 08 – Build Order

> Follow these steps in sequence. Each step has a clear goal and a done check. Do not start the next step until the current one is complete and working.

---

## Phase 0 — Project Setup ✅

### Step 1 — Initialise the Next.js Project ✅

**Done:** Next.js 14 (App Router) scaffolded with TypeScript, TailwindCSS, and ESLint.
Folder structure matches plan: `app/(auth)/`, `app/lists/`, `app/shop/[listId]/`, `app/api/`, `components/`, `lib/`.

---

### Step 2 — Configure Prettier, ESLint, and Husky ✅

**Done:** Prettier with `prettier-plugin-tailwindcss` (Tailwind class sorting) installed.
`.prettierrc` configured. Husky pre-commit hook runs `lint-staged` (ESLint fix + Prettier on staged files).
`format` and `format:check` scripts added to `package.json`.

**Note:** `.prettierrc` uses `singleQuote: false` and `trailingComma: "es5"` (differs slightly from original plan — intentional).

---

### Step 3 — Provision Railway PostgreSQL ⏳

1. Create account at railway.app
2. New project → Add PostgreSQL
3. Copy the `DATABASE_URL` connection string
4. Paste into `.env` (already created by `prisma init`)

**Done when:** You can connect to the DB with a Postgres client (e.g. TablePlus, DBeaver, or `psql`).

---

### Step 4 — Set Up Prisma ✅

**Done:** Prisma v5 installed, `prisma/schema.prisma` updated with full schema from `02_database_schema.md`.
Models: `User`, `Store`, `Item`, `List`, `ListItem`, `StoreItemOrder`.

Next (requires DATABASE_URL from Step 3):

```
npx prisma migrate dev --name init
```

**Done when:** `npx prisma studio` opens the browser and shows all empty tables.

---

### Step 5 — Create Prisma Client Singleton ✅

**Done:** `lib/db.ts` created with hot-reload guard for dev mode. Imports from `@prisma/client`.

---

### Step 6 — Seed the Database (Dev Only) ✅

**Done:** `prisma/seed.ts` created with 1 dev user, 2 stores (Tesco, Lidl), 10 common grocery items.
`tsx` added as dev dependency. `package.json` has `"prisma": { "seed": "tsx prisma/seed.ts" }`.

Run after migration:

```
npm install
npx prisma db seed
```

**Done when:** You can see the seeded data in Prisma Studio.

---

## Phase 1 — API Layer

### Step 7 — Stores API ✅

Built:

- `GET /api/stores`
- `POST /api/stores`

**Done when:** `GET /api/stores` returns seeded stores as JSON.

---

### Step 8 — Items API ✅

Built:

- `GET /api/items?search=` (case-insensitive LIKE query)
- `POST /api/items` (lowercase normalisation, upsert behaviour)

**Done when:** `GET /api/items?search=mil` returns milk, milkshake, etc.

---

### Step 9 — Lists API ✅

Built:

- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/:id`
- `PATCH /api/lists/:id`
- `DELETE /api/lists/:id`

**Done when:** You can create a list and fetch it with all fields.

---

### Step 10 — List Items API ✅

Built:

- `POST /api/list-items`
- `PATCH /api/list-items/:id`
- `DELETE /api/list-items/:id`

**Done when:** You can add items, tick them with `checkedOrder`, and delete them via API.

---

### Step 11 — Learning System ✅

Implemented in `lib/learning.ts`:

- `updateLearning(userId, storeId, listId)` — reads checked items, upserts `store_item_order` using running average formula
- `getSortedItemIds(userId, storeId, itemIds)` — sorts by `avgOrder`, unknowns at end

Wired into `PATCH /api/lists/:id` when `completed: true`.

**Done when:** After marking a list complete via API, you can see updated `avg_order` rows in Prisma Studio.

---

## Phase 2 — UI

### Step 12 — Home Page (`/lists`) ✅

Built `app/lists/page.tsx` — list of all lists (empty state + list cards).
`components/ListCard.tsx` created. Root `/` redirects to `/lists`.

**Done when:** Lists from the API appear as cards on the home page.

---

### Step 13 — Create List Flow ✅

Built `components/StorePickerModal.tsx` bottom sheet. "+ New List" button in header opens picker. On store selection, POSTs to `/api/lists` and redirects to new list. Inline "Add new store" form in modal.

**Done when:** You can go from home to store picker to new list in one flow.

---

### Step 14 — List Detail Page (`/lists/:id`) ✅

Built `app/lists/[id]/page.tsx`. `components/AddItemBar.tsx` with debounced autocomplete (queries `/api/items?search=`). `components/ItemRow.tsx` with delete. Sticky "Start Shopping" footer button.

**Done when:** You can add 3 items to a list and see them in the list.

---

### Step 15 — Shopping Mode (`/shop/:id`) ✅

Built `app/shop/[listId]/page.tsx` and `components/ShopItemButton.tsx`. Unchecked items at top, checked below divider. Progress bar. Screen Wake Lock API. Confirmation dialog on "Done" — sends PATCH to mark list complete (fires learning update).

**Done when:** You can tick all items and tap "Done Shopping" — list is marked complete in the DB and learning rows are updated.

---

## Phase 3 — Integration & Validation

### Step 16 — End-to-End Test (Manual)

Run through the full MVP acceptance criteria from `06_mvp_scope.md` manually. Both trips, on a real mobile browser.

**Done when:** Learning visibly reorders the list on the second trip.

---

### Step 17 — Deploy to Railway

1. Push code to GitHub (`git push origin master`)
2. Go to [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo** → select `SmartGrocery`
3. Railway will auto-detect Nixpacks and run `npm run build` then `node .next/standalone/server.js`
4. In the Railway project, click **+ New** → **Database** → **Add PostgreSQL**
5. In your app service → **Variables**, Railway automatically injects `DATABASE_URL` from the linked Postgres plugin
6. Add these variables manually in the Railway dashboard:
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` locally to generate
   - `NEXTAUTH_URL` — set to your Railway app URL (e.g. `https://smartgrocery-production.up.railway.app`)
7. Trigger a redeploy (or it will auto-deploy on next push)
8. In the Railway shell or via a one-off command, run the migration + seed:
   ```
   npx prisma migrate deploy
   npx prisma db seed
   ```

**Done when:** The full app is accessible at your Railway URL on a real phone.

---

## Summary Table

| Phase     | Steps | Goal                                  |
| --------- | ----- | ------------------------------------- |
| 0 – Setup | 1–6   | Project runs, DB connected, seeded    |
| 1 – API   | 7–11  | All endpoints work and learning fires |
| 2 – UI    | 12–15 | Full app usable in browser            |
| 3 – Ship  | 16–17 | Validated and deployed                |

---

## Tips

- Build each API step before its UI step — test with Thunder Client or curl
- Commit after each step completes
- Keep the learning algorithm logic in `lib/learning.ts` isolated — don't mix it into route handlers
- Run `npx prisma studio` constantly while building — it's the fastest way to debug data issues
