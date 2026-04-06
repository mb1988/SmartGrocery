# 07 – Backlog

> Everything not in MVP. Items are grouped by priority tier and theme. Tackle them in order after MVP is validated.

---

## Priority Tiers

| Tier | Definition |
|---|---|
| 🔴 High | Core usability gaps — users will ask for these immediately |
| 🟡 Medium | Valuable features — meaningfully improves daily use |
| 🟢 Low | Nice-to-have — good for retention or specific use cases |
| 🔵 Advanced | Complex — requires significant design or engineering effort |
| ⚫ External | Depends on third parties — do not start until validated |

---

## 🔴 High Priority

### Auth & Multi-User Foundation
- [ ] Add NextAuth.js with Google provider
- [ ] Sign-in / sign-out page
- [ ] Protect all routes and API endpoints with session check
- [ ] Migrate dev user data to real account on first sign-in
- [ ] Per-user data isolation (all queries scoped to `session.user.id`)

> Without this, you cannot share the app with anyone else or deploy publicly.

---

### List Management
- [ ] Delete a list (with confirmation)
- [ ] Edit list name
- [ ] Edit item quantity and unit on a list
- [ ] Remove item from list
- [ ] Repeat / clone previous list (copy all items to a new list)
  - Useful for weekly shopping — saves re-adding every week

---

### Item Management
- [ ] Edit item category when adding it
- [ ] Item name de-duplication on autocomplete (case-insensitive match)
- [ ] Show category badge on items in list view

---

### Shopping Mode Improvements
- [ ] Show item note in shopping mode (e.g. "ripe ones")
- [ ] Visual progress bar as items are checked
- [ ] Confirmation before marking "Done Shopping" (prevents accidental trigger)

---

## 🟡 Medium Priority

### Better Category System
- [ ] Enforce category list (produce, dairy, meat, bakery, frozen, pantry, drinks, household, snacks, other)
- [ ] Category filter/toggle on list view
- [ ] Group items by category as an alternative sort mode (vs route sort)
- [ ] Category icons / colour coding

---

### PWA — Install as App
- [ ] Add `manifest.json` with name, icons, theme colour
- [ ] Add `next-pwa` service worker
- [ ] Install prompt on first visit (mobile)
- [ ] Offline shell — app loads without network; shows cached data

---

### Shared Lists
- [ ] Invite another user to a list by email
- [ ] Real-time updates when both users are shopping (items ticked by one disappear for both)
  - Use Supabase Realtime or polling fallback
- [ ] Ownership model — only list owner can delete

---

### Smart Suggestions
- [ ] "You usually buy X with Y — add it?" prompt
- [ ] "You haven't added milk this week" reminder (based on purchase history)
- [ ] Suggest items from the same category when typing

---

### Learning System Improvements
- [ ] Exponential Moving Average (EMA) for recency weighting
- [ ] Show user their "route efficiency" over time (average position improvement)
- [ ] Reset learning for a specific store
- [ ] "Ignore this trip" option when shopping out of usual routine

---

## 🟢 Low Priority

### Notifications & Reminders
- [ ] Push notification: "Time for your weekly shop?"
- [ ] In-app badge showing uncompleted active lists
- [ ] Reminder if a list has not been shopped after X days

### UX Polish
- [ ] Dark mode (TailwindCSS `dark:` variants already planned)
- [ ] Animations on check/uncheck (smooth, not distracting)
- [ ] Haptic feedback on item check (browser vibration API)
- [ ] Screen wake lock on Shopping Mode
- [ ] Swipe-to-delete on items
- [ ] Drag-to-reorder manual override

### List History & Analytics
- [ ] Past lists archive
- [ ] "How many times have you bought X?" insight
- [ ] Average shopping trip duration
- [ ] Most frequently bought items

---

## 🔵 Advanced Features

### Location-Based Store Detection
- [ ] Detect nearest known store using device GPS
- [ ] Auto-suggest "Start shopping at Tesco?" based on location
- [ ] Requires user permission; must have a clear opt-in/opt-out

### Store Map / Aisle Visualisation
- [ ] User-drawn aisle map for a store
- [ ] Assign items to aisles
- [ ] Route view: see your shopping path on the map
- [ ] This is complex — validate demand before building

### AI-Based Recommendations
- [ ] Predict next week's list based on purchase history patterns
- [ ] "You usually buy this in week 2 of the month" insights
- [ ] Natural language item add: type "2 litres of semi-skimmed" → parses to item + quantity + unit

### Voice Input
- [ ] "Add milk" — voice command to add item
- [ ] Use browser Speech Recognition API (Web Speech API)
- [ ] Fallback: manual input

### Receipt Integration
- [ ] Upload or photograph a receipt
- [ ] Extract items via OCR and add to a list or history
- [ ] Requires OCR service (Tesseract.js or cloud API)

---

## ⚫ External Integrations

> These all depend on third parties. Do not start until MVP is validated and you know users want them.

- [ ] **Promotions scraping** — scrape supermarket offers (Tesco, Lidl, Aldi)
  - Legal risk: check ToS carefully; may need official partnerships
- [ ] **Store inventory APIs** — check if item is in stock at a specific store
  - Very few UK/EU stores expose this publicly
- [ ] **Loyalty card integration** — tie purchases to Tesco Clubcard, Nectar, etc.
  - Requires OAuth with each store separately
- [ ] **Recipe-based lists** — import recipes from URLs, extract ingredients, add to list
  - Use structured data (schema.org Recipe) where available
- [ ] **Shared household** — family account with multiple users under one household
  - Different from shared lists — managed billing, shared pantry

---

## Backlog Review Cadence

After MVP ships:
1. Review this backlog
2. Pick 2–3 items from 🔴 High for the first post-MVP sprint
3. Reassess after each sprint — user feedback may reprioritise
