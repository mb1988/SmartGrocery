# 09 – Recommendations & Suggested Modifications

> This document contains honest assessments of the original plan — what is good, what has issues, and what I would change. Read this alongside the other documents.

---

## What the Original Plan Gets Right

- **The core learning concept is solid.** A running average of checked order is simple, explainable, and improves with every use. It does not require a model, training data, or an AI API.
- **Starting with Next.js + PostgreSQL is the right call.** No over-engineering. Relational data is the correct model for this problem.
- **Mobile-first is correct.** This app is used in a store, not at a desk.
- **Deferring store maps and promotions is smart.** Those are complex problems. The value here is in the learning, not the data enrichment.

---

## Issues Found and How They Are Fixed

### 1. `store_item_order` has no `user_id` — Critical

**Problem:** The original schema has `(store_id, item_id)` in the learning table. This means everyone who shops at Tesco shares the same learned order. User A's habits overwrite User B's.

**Fix in this plan:** `store_item_order` now has `user_id` as part of a unique constraint `(user_id, store_id, item_id)`. Each user gets their own learning profile per store.

_See `02_database_schema.md`_

---

### 2. `users` table is just an `id` — Blocks Everything Later

**Problem:** `users (id SERIAL PRIMARY KEY)` has no email, no name, no timestamps. Adding auth later requires a painful migration against live data.

**Fix:** Add `email`, `name`, and `created_at` to users now. Even if you skip auth for MVP, the column is ready.

_See `02_database_schema.md`_

---

### 3. No `GET /api/lists` Endpoint

**Problem:** The original API design has `GET /api/lists/:id` but no way to list all lists for a user. The home screen has nothing to display.

**Fix:** Added `GET /api/lists` to the API design.

_See `04_api_design.md`_

---

### 4. No `DELETE` Endpoints

**Problem:** Users cannot delete lists or remove items from lists. This makes the app feel broken almost immediately.

**Fix:** Added `DELETE /api/lists/:id` and `DELETE /api/list-items/:id`.

_See `04_api_design.md`_

---

### 5. No `quantity` or `unit` on `list_items`

**Problem:** Can't write "2 litres of milk" — you can only add "milk". This is a basic need for a grocery app.

**Fix:** Added `quantity` (numeric, default 1) and `unit` (text, nullable) to `list_items`.

_See `02_database_schema.md`_

---

### 6. No Unique Constraint on `store_item_order`

**Problem:** Without `UNIQUE (user_id, store_id, item_id)`, duplicate rows can be inserted if the upsert logic has a race condition or a bug. The running average then calculates on the wrong base.

**Fix:** Unique constraint added. The insert uses an `UPSERT` (`ON CONFLICT DO UPDATE`).

_See `02_database_schema.md`_

---

## Suggested Additions (Not Blockers, But Worth Doing Early)

### Add a `note` field to `list_items`

Cost: one column, 10 minutes. Value: "ripe ones", "own brand", "gluten free" — these are things people actually write on paper lists. Not adding this is a regrettable omission.

---

### Add `lists.completedAt` instead of a boolean `completed`

A `completedAt TIMESTAMP` column gives you:

- Is it complete? (`completedAt IS NOT NULL`)
- When was it completed? (for history, analytics, "repeat last week's list")

More information, same effort.

---

### Add a `lists.name` column

"Weekly Shop", "Party", "Christmas" — users will want to name their lists. One nullable `TEXT` column. Add it now.

---

### Consider Supabase if You Want Realtime Later

The current plan uses Railway PostgreSQL. This is fine for MVP. However, if you want "shared lists update live when your partner checks something off", you will need realtime push. Supabase wraps Postgres with a realtime subscription layer.

**Recommendation:** Stick with Railway for both the app and the database — same project, same dashboard, `DATABASE_URL` is injected automatically. If shared lists become a priority, evaluate Supabase at that point — migrating Postgres is straightforward.

---

### Auth: Do Not Skip If You Plan to Share the App

The original plan defers auth entirely. This is acceptable for local dev. But the moment you want someone else to use it, you need user isolation.

**Recommended minimal auth:**

- Add NextAuth.js with Google sign-in
- One provider, no passwords, no email verification flow
- Costs ~2 hours to set up properly
- Protects against building on a schema that has no `userId` concept

If you truly want to skip auth for MVP, at minimum insert a seed user and hardcode `userId = 1` in all API routes with a comment flagging it for replacement.

---

### Learning Trigger: Complete vs. Partial Lists

The current plan triggers learning when the user taps "Done Shopping". Consider what happens if they:

- Complete the trip but forget to tap "Done" — data is lost
- Tap "Done" after only checking 3 of 10 items — partial data is recorded

**Recommendation:** Record `checked_order` in real-time (on each tap). The "Done Shopping" endpoint only sets `completedAt` and runs the aggregate update. This way, if the user never taps Done, you can offer "resume last session" rather than losing the data.

---

## Things That Sound Good But Should Wait

| Idea                | Why to Wait                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| AI recommendations  | No data yet. You need 10+ shopping sessions before patterns are meaningful.                           |
| Promotions scraping | Legal and technical complexity. Validate users want this first.                                       |
| Store maps / aisles | The passive route learning _is_ the store map. Manual entry adds friction and duplicates the concept. |
| React Native app    | The Next.js PWA will feel native enough for validation. A second codebase doubles maintenance.        |
| Barcode scanning    | Useful, but complex. Solve "can I create and complete a list" first.                                  |

---

## Final Recommendation: Definition of a Successful MVP

Ship the MVP when you can personally use it for two consecutive real grocery trips and find yourself annoyed when you have to open a notes app instead. That is the bar. Not feature count — does it solve your own problem? If yes, others will use it.
