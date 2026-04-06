# 05 – UI / UX Plan

> Pages, user flows, component notes, and UX decisions for SmartGrocery.

---

## Design Principles

1. **Touch-first** — minimum tap target size 48×48px on all interactive elements
2. **One action per screen** — don't crowd; each page has a single primary job
3. **Minimal friction** — adding an item should take 2 taps maximum
4. **Shopping Mode is sacred** — once in the store, the UI must be fast, uncluttered, one-handed operable

---

## Pages (MVP)

### 1. Home / My Lists — `/lists`

**Purpose:** Entry point. See all active and past lists.

**UI Elements:**
- Top bar: App name + "New List" button (large, prominent)
- List of shopping lists — each card shows:
  - List name (or "Tesco – 6 Apr" if no name)
  - Store name
  - Item count / checked count (e.g. "4 / 12 items")
  - Status badge: Active | Completed
- Tap a list → go to List Detail
- Long-press / swipe → delete list option

**Empty state:** Friendly message + big "Create your first list" button.

---

### 2. Store Selector — `/stores` (Modal or Page)

**Purpose:** Pick which store this list is for before creating a new list.

**UI Elements:**
- List of user's stores
- "Add new store" button at bottom
- Search/filter if many stores
- Tap → select and proceed to new list

**Notes:**
- Can be a bottom sheet modal on top of the home screen rather than a separate page
- Selecting a store sets `storeId` on the new list

---

### 3. List Detail / Edit — `/lists/:id`

**Purpose:** View the list, add items, manage items before shopping.

**UI Elements:**
- Header: store name + list name (editable)
- "Start Shopping" button (sticky at bottom, large)
- Add item bar at top:
  - Text input with autocomplete dropdown from item catalogue
  - Quantity field (optional — can expand inline)
  - Add button (or press Enter)
- Item rows:
  - Checkbox (left)
  - Item name (tappable for edit/note)
  - Quantity + unit
  - Delete / swipe-to-remove

**Notes:**
- Items shown in learning-sorted order even in edit view (so user can see their route)
- Newly added items with no learning data appear at the bottom

---

### 4. Shopping Mode — `/shop/:listId`

**Purpose:** Active shopping. One-tap checkoff. Minimal UI. Fast.

**UI Elements:**
- Full-screen list
- Each item is a large button (full width, tall row)
- Unchecked items at top — bold, large text
- Checked items below a divider — smaller, greyed out, strikethrough
- Item name + quantity visible at a glance
- No editing in this view — only checking/unchecking
- "Done Shopping" button at top (confirms session end + triggers learning update)
- Progress bar or "X of Y" counter at top

**Interaction Flow:**
```
Tap item → item moves to checked section below
Tap checked item → uncheck (moves back up)
Tap "Done Shopping" → confirmation dialog → triggers learning update → redirect to list or home
```

**Notes:**
- Large tap targets are essential here — user has a phone in one hand and a basket in the other
- Consider haptic feedback on check (browser vibration API)
- Screen should stay awake (Screen Wake Lock API — available in modern mobile browsers)

---

### 5. Settings / Store Management — `/settings`

**Purpose (Post-MVP):** Manage stores, preferences, account.

For MVP this can be a minimal page with just:
- "My Stores" list with add/delete
- Name/email if auth is added

---

## Navigation Structure

```
App
├── /lists                  (Home — list of lists)
│   └── [New List Modal]    (store picker + optional name)
├── /lists/:id              (List detail + edit)
├── /shop/:id               (Shopping mode — full screen)
└── /settings               (Post-MVP)
```

---

## Component Breakdown

| Component | Used In | Notes |
|---|---|---|
| `ListCard` | `/lists` | Summary of a single list |
| `ItemRow` | `/lists/:id` | Editable item in list |
| `ShopItemButton` | `/shop/:id` | Large tap-to-check button |
| `AddItemBar` | `/lists/:id` | Input + autocomplete |
| `StorePickerModal` | New list flow | Bottom sheet |
| `ProgressHeader` | `/shop/:id` | "X of Y checked" bar |
| `EmptyState` | `/lists` | No-lists prompt |

---

## Colour + Theme Notes

- Keep it clean and white — grocery apps are utility tools, not lifestyle brands
- One accent colour (green works well — association with fresh food)
- Use `font-bold` and large `text-xl` / `text-2xl` in Shopping Mode
- Checked items: `line-through text-gray-400` 
- TailwindCSS dark mode: implement from the start with `dark:` variants

---

## Mobile UX Considerations

| Feature | Rationale |
|---|---|
| Bottom sheet modals | Easier to reach with thumb on tall phones |
| Sticky "Start Shopping" button | Always reachable — no scroll required |
| Swipe-to-delete on items | Standard mobile pattern |
| Autocomplete on item add | Prevents duplicates in catalogue |
| Wake lock on `/shop/:id` | Screen off mid-shop is frustrating |
