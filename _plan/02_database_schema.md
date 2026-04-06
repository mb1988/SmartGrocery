# 02 – Database Schema

> This document defines the full data model for SmartGrocery, including the original proposed schema, the identified issues, and the improved version.

---

## Original Schema (As Proposed)

```sql
CREATE TABLE users (id SERIAL PRIMARY KEY);
CREATE TABLE stores (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE items (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT);
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  store_id INT REFERENCES stores(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE list_items (
  id SERIAL PRIMARY KEY,
  list_id INT REFERENCES lists(id),
  item_id INT REFERENCES items(id),
  checked BOOLEAN DEFAULT FALSE,
  checked_order INT
);
CREATE TABLE store_item_order (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  item_id INT REFERENCES items(id),
  avg_order FLOAT DEFAULT 0,
  times_seen INT DEFAULT 0
);
```

---

## Issues with the Original Schema

| Table | Issue | Impact |
|---|---|---|
| `users` | No `email`, `name`, or `created_at` — just a bare `id` | Cannot support auth later without migration |
| `stores` | No `user_id` — stores are global, not owned by a user | All users share the same stores |
| `list_items` | No `quantity` or `unit` — can't say "2 litres of milk" | Important for practical use |
| `store_item_order` | **No `user_id`** — learning is shared across all users | Critical bug: your habits overwrite my habits |
| `store_item_order` | No unique constraint on `(store_id, item_id, user_id)` | Duplicate rows possible; avg calculation breaks |
| All tables | No `updated_at` timestamps | Cannot tell when data was last modified |
| All tables | No soft delete — `deleted_at` column | Deleting a list cascades badly |
| `items` | `category` is free text — inconsistent values | "Dairy", "dairy", "DAIRY" are different categories |

---

## Improved Schema (Recommended)

```sql
-- Users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Stores (owned per-user so my Tesco and your Tesco can differ)
CREATE TABLE stores (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Global item catalogue (shared, name normalised to lowercase)
CREATE TABLE items (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,  -- normalised: lowercase, trimmed
  category    TEXT                   -- see category list below
);

-- Shopping lists
CREATE TABLE lists (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id    INT REFERENCES stores(id) ON DELETE SET NULL,
  name        TEXT,                  -- optional: "Weekly Shop", "Party"
  created_at  TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP            -- null = in progress
);

-- Items within a list
CREATE TABLE list_items (
  id            SERIAL PRIMARY KEY,
  list_id       INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  item_id       INT NOT NULL REFERENCES items(id),
  quantity      NUMERIC(10,2) DEFAULT 1,
  unit          TEXT,                -- "kg", "litre", "pack", null = count
  checked       BOOLEAN DEFAULT FALSE,
  checked_order INT,                 -- position in which user ticked this
  checked_at    TIMESTAMP,
  note          TEXT                 -- "ripe ones only", "own brand"
);

-- Per-user, per-store learning data
CREATE TABLE store_item_order (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id    INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id     INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  avg_order   FLOAT NOT NULL DEFAULT 0,
  times_seen  INT NOT NULL DEFAULT 0,
  last_seen   TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, store_id, item_id)   -- prevents duplicate rows
);
```

---

## Recommended Item Categories (Enum-like)

Rather than free text, constrain `category` to a known list in application code (or a Postgres CHECK constraint):

```
produce       — fruit, vegetables
dairy         — milk, cheese, butter, yoghurt
meat          — beef, chicken, pork, fish
bakery        — bread, pastries
frozen        — frozen meals, ice cream
pantry        — tinned goods, pasta, rice, spices
drinks        — soft drinks, juice, water
household     — cleaning, toiletries
snacks        — crisps, chocolate, biscuits
other
```

---

## Prisma Schema (Code Version)

The above in Prisma format (go in `prisma/schema.prisma`):

```prisma
model User {
  id         Int      @id @default(autoincrement())
  email      String   @unique
  name       String?
  createdAt  DateTime @default(now())

  stores     Store[]
  lists      List[]
  learning   StoreItemOrder[]
}

model Store {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  name      String
  address   String?
  createdAt DateTime @default(now())

  lists     List[]
  learning  StoreItemOrder[]
}

model Item {
  id       Int     @id @default(autoincrement())
  name     String  @unique
  category String?

  listItems  ListItem[]
  learning   StoreItemOrder[]
}

model List {
  id          Int       @id @default(autoincrement())
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
  store       Store?    @relation(fields: [storeId], references: [id])
  storeId     Int?
  name        String?
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  items       ListItem[]
}

model ListItem {
  id           Int       @id @default(autoincrement())
  list         List      @relation(fields: [listId], references: [id])
  listId       Int
  item         Item      @relation(fields: [itemId], references: [id])
  itemId       Int
  quantity     Float     @default(1)
  unit         String?
  checked      Boolean   @default(false)
  checkedOrder Int?
  checkedAt    DateTime?
  note         String?
}

model StoreItemOrder {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  store     Store    @relation(fields: [storeId], references: [id])
  storeId   Int
  item      Item     @relation(fields: [itemId], references: [id])
  itemId    Int
  avgOrder  Float    @default(0)
  timesSeen Int      @default(0)
  lastSeen  DateTime @default(now())

  @@unique([userId, storeId, itemId])
}
```

---

## Key Design Decisions

1. **`store_item_order` is per user** — each user builds their own learning profile. This is the most important fix from the original schema.
2. **Items are global** — a shared catalogue prevents duplicates ("milk" and "Milk" are the same item). Names are normalised to lowercase on insert.
3. **`lists.completedAt`** — marks a list as done cleanly. Useful for "repeat last list" feature.
4. **`list_items.note`** — small but high-value UX feature. Costs nothing to add now.
5. **Cascade deletes** — deleting a user removes their stores, lists, and learning data automatically.
