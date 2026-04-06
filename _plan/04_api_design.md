# 04 – API Design

> All API endpoints for SmartGrocery. Built as Next.js API Route Handlers under `app/api/`.

---

## Conventions

- All routes return JSON
- Errors return `{ error: string }` with an appropriate HTTP status
- `user_id` is derived from the session (NextAuth) — never passed in the request body
- IDs in URLs are numeric
- Request bodies use `camelCase` to match JavaScript convention
- All timestamps returned as ISO 8601 strings

---

## Authentication

For MVP, use a single hardcoded dev user or a simple NextAuth session. Every route that reads or writes data must scope to `session.user.id` — never trust a `userId` from the request body.

---

## Stores

### `GET /api/stores`
Returns all stores for the current user.

**Response:**
```json
[
  { "id": 1, "name": "Tesco", "address": null },
  { "id": 2, "name": "Lidl", "address": "High Street" }
]
```

### `POST /api/stores`
Create a new store for the current user.

**Body:**
```json
{ "name": "Aldi", "address": "optional" }
```

**Response:** `201` with the created store object.

---

## Lists

### `GET /api/lists`
Returns all lists for the current user, newest first.

**Response:**
```json
[
  {
    "id": 5,
    "name": "Weekly Shop",
    "storeId": 1,
    "storeName": "Tesco",
    "createdAt": "2026-04-06T10:00:00Z",
    "completedAt": null,
    "itemCount": 12,
    "checkedCount": 0
  }
]
```

### `POST /api/lists`
Create a new list, optionally cloning a previous list.

**Body:**
```json
{
  "storeId": 1,
  "name": "Weekly Shop",
  "cloneFromListId": 4    // optional — copies items from that list
}
```

**Response:** `201` with the created list object.

### `GET /api/lists/:id`
Returns a single list with all its items, sorted by learning order (if available).

**Response:**
```json
{
  "id": 5,
  "name": "Weekly Shop",
  "store": { "id": 1, "name": "Tesco" },
  "createdAt": "2026-04-06T10:00:00Z",
  "completedAt": null,
  "items": [
    {
      "listItemId": 10,
      "itemId": 3,
      "name": "milk",
      "category": "dairy",
      "quantity": 2,
      "unit": "litre",
      "checked": false,
      "checkedOrder": null,
      "note": null,
      "avgOrder": 1.5
    }
  ]
}
```

### `PATCH /api/lists/:id`
Update list metadata (name, mark as complete).

**Body:**
```json
{ "name": "Party Shop", "completed": true }
```

When `completed: true` is sent, the API must:
1. Set `completedAt = now()`
2. Trigger the learning update (`updateLearning()` from `lib/learning.ts`)

**Response:** `200` with updated list.

### `DELETE /api/lists/:id`
Soft-delete or hard-delete the list. Cascade removes `list_items`.

---

## Items (Global Catalogue)

### `GET /api/items?search=mil`
Search for items by name (used for autocomplete when adding to a list).

**Response:**
```json
[
  { "id": 3, "name": "milk", "category": "dairy" },
  { "id": 14, "name": "milkshake", "category": "drinks" }
]
```

### `POST /api/items`
Create a new item in the global catalogue (if it does not already exist).

**Body:**
```json
{ "name": "oat milk", "category": "dairy" }
```

**Behaviour:** normalise `name` to lowercase and trimmed before insert. If already exists, return the existing item (`200`) rather than an error.

---

## List Items

### `POST /api/list-items`
Add an item to a list. Creates the item in catalogue first if it does not exist.

**Body:**
```json
{
  "listId": 5,
  "itemName": "oat milk",
  "quantity": 1,
  "unit": "litre",
  "note": null
}
```

**Response:** `201` with the `list_items` row.

### `PATCH /api/list-items/:id`
Update a list item. Handles two separate use cases:

**Use case A – tick/untick:**
```json
{ "checked": true, "checkedOrder": 3 }
```

**Use case B – edit details:**
```json
{ "quantity": 2, "unit": "kg", "note": "ripe ones" }
```

**Response:** `200` with updated list item.

### `DELETE /api/list-items/:id`
Remove an item from a list.

---

## Summary Table

| Method | Path | Action |
|---|---|---|
| GET | `/api/stores` | List user's stores |
| POST | `/api/stores` | Create store |
| GET | `/api/lists` | List user's lists |
| POST | `/api/lists` | Create list (with optional clone) |
| GET | `/api/lists/:id` | Get list + sorted items |
| PATCH | `/api/lists/:id` | Update list / mark complete |
| DELETE | `/api/lists/:id` | Delete list |
| GET | `/api/items?search=` | Search item catalogue |
| POST | `/api/items` | Create item |
| POST | `/api/list-items` | Add item to list |
| PATCH | `/api/list-items/:id` | Tick item / edit item |
| DELETE | `/api/list-items/:id` | Remove item from list |

---

## Notes

- The original plan was missing `GET /api/lists` (list all lists) — added here.
- The original plan was missing all `DELETE` endpoints — added here.
- `PATCH /api/lists/:id` with `completed: true` is the trigger point for the learning update. Do not call learning logic from the tick endpoint — wait until the session is over.
