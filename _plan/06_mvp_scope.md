# 06 – MVP Scope

> This document defines exactly what is in and out of the MVP. Use it to stay focused. If something is not on this list, it goes in the backlog.

---

## MVP Goal

A single user can create a shopping list, add items, shop using the app, and return to find their next list is sorted by the route they walked.

---

## In Scope

### Infrastructure
- [ ] Next.js 14 project initialised (App Router)
- [ ] TailwindCSS configured
- [ ] Railway PostgreSQL database provisioned
- [ ] Prisma ORM set up and connected
- [ ] Schema migrated to database
- [ ] Environment variables configured (local + Vercel)
- [ ] Deployed to Vercel

### Auth (Minimal)
- [ ] Hardcoded single dev user in database (skip full auth for MVP)
  - OR NextAuth with one provider (Google) — see `09_recommendations.md`

### Stores
- [ ] View list of stores
- [ ] Create a new store

### Lists
- [ ] View all lists
- [ ] Create a new list (select store)
- [ ] View single list with items

### Items
- [ ] Add item to list (with autocomplete from catalogue)
- [ ] Remove item from list
- [ ] Item is created in global catalogue if it does not exist

### Shopping Mode
- [ ] Enter shopping mode from list detail page
- [ ] Items displayed sorted by learning order (or alphabetical if no data)
- [ ] Tap item to check it off — records `checked_order`
- [ ] Tap checked item to uncheck
- [ ] "Done Shopping" button — marks list complete, triggers learning update

### Learning System
- [ ] `updateLearning()` function in `lib/learning.ts`
- [ ] Called when list is marked complete
- [ ] `getSortedItems()` function in `lib/learning.ts`
- [ ] Used when fetching list for Shopping Mode

---

## Out of Scope (MVP)

| Feature | Where It Lives |
|---|---|
| Full auth / sign-up flow | Backlog — High |
| Edit item quantity / unit in list | Backlog — High |
| Delete list | Backlog — High |
| Edit list name | Backlog — Medium |
| Repeat / clone previous list | Backlog — High |
| Shared lists | Backlog — Medium |
| Smart suggestions | Backlog — Medium |
| Offline mode | Backlog — Medium |
| Categories UI / filtering | Backlog — Medium |
| Notifications | Backlog — Low |
| Location-based store detection | Backlog — Advanced |
| Promotions | Backlog — External |
| Barcode scanning | Backlog — Advanced |
| PWA manifest / install prompt | Backlog — Medium |
| Dark mode | Nice to have |

---

## MVP Acceptance Criteria

The MVP is shippable when the following scenario works end-to-end:

1. User sees an empty home screen with "No lists yet"
2. User creates a store ("Tesco")
3. User creates a list for Tesco
4. User adds 5 items: bread, milk, cheese, apples, pasta
5. User taps "Start Shopping"
6. Items are sorted (alphabetical on first use)
7. User taps each item in this order: milk → cheese → bread → apples → pasta
8. User taps "Done Shopping"
9. User creates a **new** list for Tesco
10. Adds the same 5 items
11. Taps "Start Shopping"
12. Items are now sorted: milk → cheese → bread → apples → pasta (reflecting learned order)

---

## MVP Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (mobile 4G) | < 2 seconds |
| Time to check an item | < 1 tap |
| Works on iPhone Safari | Yes |
| Works on Android Chrome | Yes |
| No login required (dev user) | Yes for MVP |
