# 00 – Overview & Vision

> Read this first. Every other document in this folder builds on what is defined here.

---

## What Is SmartGrocery?

SmartGrocery is a mobile-first web app that helps people shop faster and smarter. It learns the order in which a user checks off items in a specific store and automatically reorders future lists to match that real-world walking path.

The app reduces the time spent backtracking through a store by adapting to the user's natural route — without ever requiring them to enter a store map or aisle layout manually.

---

## Problem Being Solved

Most grocery apps let you build a list. None of them remember where things are *for you*. Store layouts differ, and each person shops differently. SmartGrocery removes that friction through passive learning — every shopping trip makes the next one better.

---

## Who Is It For?

| User Type | Why They'd Use It |
|---|---|
| Regular weekly shoppers | Consistent store, wants fastest path |
| Parents | Share lists, reduce forgotten items |
| People with routines | App adapts to their existing habits automatically |

---

## Core Value Proposition

> "The more you use it, the smarter your list gets."

- No manual effort required to improve suggestions
- Works per-store (your Tesco and your Lidl are different routes)
- Learning is personal (your avg_order, not everyone's)

---

## Done Criteria (MVP)

The MVP is complete when a single user can:

1. Choose or create a store
2. Create a shopping list for that store
3. Add items to the list
4. Enter "Shopping Mode" and tick items off one by one
5. Return to the app and see that the next list is reordered based on the order they ticked

---

## Out of Scope for MVP

- Authentication (multi-user login) — use a single hardcoded or local user for now
- Promotions or price data
- Barcode scanning
- Store maps
- Sharing lists
- Offline mode

---

## Long-Term Vision

SmartGrocery becomes the go-to shopping companion that:

- Predicts what you need before you add it
- Knows your store layout better than the app that comes with it
- Optionally integrates with receipts, voice input, and promotions
- Works for households, not just individuals

---

## Document Reading Order

| # | File | Purpose |
|---|---|---|
| 00 | `00_overview_and_vision.md` | Start here — what and why |
| 01 | `01_tech_stack.md` | Technology choices and rationale |
| 02 | `02_database_schema.md` | Data model with improvements |
| 03 | `03_learning_system.md` | The core algorithm explained |
| 04 | `04_api_design.md` | All API endpoints |
| 05 | `05_ui_ux_plan.md` | Pages, flows, and component notes |
| 06 | `06_mvp_scope.md` | Exactly what to build first |
| 07 | `07_backlog.md` | Everything after MVP, prioritised |
| 08 | `08_build_order.md` | Step-by-step implementation sequence |
| 09 | `09_recommendations.md` | Suggested improvements and reasoning |
