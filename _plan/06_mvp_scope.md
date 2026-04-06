# 06 – MVP Scope

> This document defines exactly what is in and out of the MVP. Use it to stay focused. If something is not on this list, it goes in the backlog.

---

## MVP Goal

A single user can create a shopping list, add items, shop using the app, and return to find their next list is sorted by the route they walked.

---

## In Scope

### Infrastructure

- [x] Next.js 14 project initialised (App Router)
- [x] TailwindCSS configured
- [ ] Railway PostgreSQL database provisioned
- [x] Prisma ORM set up (v5, schema.prisma with postgresql provider)
- [x] Schema updated with full models (User, Store, Item, List, ListItem, StoreItemOrder)
- [ ] Schema migrated to database (run `npx prisma migrate dev --name init` after Step 3)
- [x] Environment variables configured locally (`.env`, `.env.example`)
- [ ] Environment variables configured on Vercel
- [ ] Deployed to Vercel

### Auth (Minimal)

- [x] NextAuth v5 installed and wired in `lib/auth.ts` (guest session, no providers yet)
  - Providers to add post-MVP or swap for Google — see `09_recommendations.md`

### Stores

- [x] View list of stores
- [x] Create a new store

### Lists

- [x] View all lists
- [x] Create a new list (select store)
- [x] View single list with items

### Items

- [x] Add item to list (with autocomplete from catalogue)
- [x] Remove item from list
- [x] Item is created in global catalogue if it does not exist

### Shopping Mode

- [x] Enter shopping mode from list detail page
- [x] Items displayed sorted by learning order (or alphabetical if no data)
- [x] Tap item to check it off — records `checked_order` (`PATCH /api/list-items/:id`)
- [x] Tap checked item to uncheck
- [x] "Done Shopping" button — marks list complete, triggers learning update

### Learning System

- [x] `updateLearning()` function in `lib/learning.ts`
- [x] Called when list is marked complete
- [x] `getSortedItemIds()` function in `lib/learning.ts`
- [x] Used when fetching list for Shopping Mode

---

## Out of Scope (MVP)

| Feature                           | Where It Lives                                                    |
| --------------------------------- | ----------------------------------------------------------------- |
| Full auth / sign-up flow          | Backlog — High                                                    |
| Edit item quantity / unit in list | Backlog — High                                                    |
| Delete list                       | Backlog — High                                                    |
| Edit list name                    | Backlog — Medium                                                  |
| Repeat / clone previous list      | Backlog — High                                                    |
| Shared lists                      | Backlog — Medium                                                  |
| Smart suggestions                 | Backlog — Medium                                                  |
| Offline mode                      | Backlog — Medium                                                  |
| Categories UI / filtering         | Backlog — Medium                                                  |
| Notifications                     | Backlog — Low                                                     |
| Location-based store detection    | Backlog — Advanced                                                |
| Promotions                        | Backlog — External                                                |
| Barcode scanning                  | Backlog — Advanced                                                |
| PWA manifest / install prompt     | ~~Backlog~~ Done — `public/manifest.json` + `next-pwa` configured |
| Dark mode                         | Nice to have                                                      |

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

| Requirement                  | Target      |
| ---------------------------- | ----------- |
| Page load (mobile 4G)        | < 2 seconds |
| Time to check an item        | < 1 tap     |
| Works on iPhone Safari       | Yes         |
| Works on Android Chrome      | Yes         |
| No login required (dev user) | Yes for MVP |
