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

### Step 3 — Provision Neon PostgreSQL ✅

Neon project provisioned. `DATABASE_URL` set in `.env` (Prisma pooler connection string, eu-west-2).
Migration `20260406211525_init` created and applied.

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

### Step 16 — End-to-End Test (Manual) ⏳ ← NEXT

Pre-requisite: seed the DB if not done yet:

```
npx prisma db seed
```

Then start dev server:

```
npm run dev
```

Run through the full MVP acceptance criteria from `06_mvp_scope.md` manually. Both trips, on a real mobile browser (or browser DevTools mobile viewport).

**Done when:** Learning visibly reorders the list on the second trip.

---

### Step 17 — Deploy to Vercel

1. Generate `NEXTAUTH_SECRET` — in PowerShell:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
   ```
2. Add to `.env.local`:
   ```
   NEXTAUTH_SECRET=<generated value>
   NEXTAUTH_URL=http://localhost:3000
   ```
3. Push code to GitHub (`git push origin master`)
4. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import `SmartGrocery` from GitHub
5. Vercel auto-detects Next.js — no extra config needed
6. Add environment variables in Vercel project settings (Settings → Environment Variables):
   - `DATABASE_URL` — your Neon pooler connection string
   - `NEXTAUTH_SECRET` — the generated value from step 1
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://smart-grocery.vercel.app`)
7. Click **Deploy**
8. Migration is already applied to the Neon DB — just seed if not done:
   ```
   npx prisma db seed
   ```

**Done when:** The full app is accessible at your Vercel URL on a real phone.

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
