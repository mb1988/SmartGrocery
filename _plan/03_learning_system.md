# 03 – Learning System

> This document explains the core algorithm that makes SmartGrocery "smart" — how it learns item order and how it applies that learning.

---

## Core Concept

Every time a user shops, they tick items off in a real-world order that reflects how they walk around that store. SmartGrocery records that order and uses it to sort the list on the next visit.

The algorithm is deliberately simple. No ML model. No neural network. A single maths operation per item. This is a feature, not a limitation — it is fast, explainable, and works from the very first trip.

---

## Step 1 – Capture Order During Shopping

When the user checks an item off in Shopping Mode, the app records:

- `checked_order` — the sequence number (1st tick = 1, 2nd tick = 2, etc.)
- `checked_at` — the timestamp

This is stored on the `list_items` row for that shopping session.

---

## Step 2 – Update the Learning Table

When the shopping session ends (user marks list as complete), trigger an update to `store_item_order` for every checked item:

### Formula (Running Average)

```
new_avg = ((old_avg × times_seen) + checked_order) / (times_seen + 1)
```

### Example

| Session | checked_order | Calculation | new_avg |
|---|---|---|---|
| 1st trip | 3 | (0 × 0 + 3) / 1 | 3.0 |
| 2nd trip | 5 | (3.0 × 1 + 5) / 2 | 4.0 |
| 3rd trip | 2 | (4.0 × 2 + 2) / 3 | 3.33 |

The average smooths out one-off deviations (e.g. the day you went to the cheese counter first).

---

## Step 3 – Apply Learning to Next List

When a user opens a new list (or clicks "Sort by my route"), fetch all items' `avg_order` from `store_item_order` and sort ascending.

Items with no learning data (first time seeing an item) are placed at the **end** of the list, sorted alphabetically among themselves.

```
Sorted items = [
  items WITH avg_order  → sorted by avg_order ASC,
  items WITHOUT avg_order → sorted by name ASC (appended at end)
]
```

---

## Improvement: Weighted Recency (Post-MVP)

The plain running average treats a trip from 6 months ago equally to yesterday. An **Exponential Moving Average (EMA)** weights recent sessions more heavily:

```
new_avg = (α × checked_order) + ((1 - α) × old_avg)
```

Where `α` (alpha) is a smoothing factor between 0 and 1:
- `α = 0.3` → recent trips count for 30%, history for 70%
- `α = 0.5` → recency and history are equal weight

**Recommendation:** Start with plain average for MVP. Add EMA in backlog phase once you have real usage data to tune `α`.

---

## Edge Cases to Handle

| Case | How to Handle |
|---|---|
| Item added to list but never checked | Do not update `store_item_order` for this item |
| User checks item then unchecks it | Only the final `checked_order` at session end counts |
| User shops at a store for the first time | No learning data yet — alphabetical order |
| User changes store mid-list | Warn user that learning applies to the *original* selected store |
| Two items tied on `avg_order` | Sort alphabetically as tiebreaker |
| Item exists in `items` but not `store_item_order` | Insert new row with the first recorded `checked_order` |

---

## Where the Logic Lives

All learning logic should live in a single file: `lib/learning.ts`

Two functions needed:

```typescript
// Called when a list is marked complete
updateLearning(userId: number, storeId: number, listId: number): Promise<void>

// Called when loading a list in Shopping Mode
getSortedItems(userId: number, storeId: number, itemIds: number[]): Promise<Item[]>
```

Keeping this isolated makes it easy to swap the algorithm later (e.g. replace running average with EMA) without touching the API layer.

---

## Data Flow Diagram

```
User ticks item
      │
      ▼
list_items.checked_order = N
list_items.checked_at = now()
      │
      ▼  (on list complete)
For each checked item:
  store_item_order UPSERT
  (user_id, store_id, item_id)
  avg_order = new weighted avg
  times_seen += 1
  last_seen = now()
      │
      ▼  (on next list open)
SELECT avg_order FROM store_item_order
WHERE user_id = ? AND store_id = ?
ORDER BY avg_order ASC
```
