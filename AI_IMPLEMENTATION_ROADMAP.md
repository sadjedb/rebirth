# AI_IMPLEMENTATION_ROADMAP.md

# Enterprise Admin SaaS — Master Implementation Roadmap

This document exists so that any AI (Claude, ChatGPT, Gemini, Cursor, etc.) can immediately understand:

- what has already been completed,
- the architectural rules of the project,
- what must never be changed,
- and exactly what module comes next.

The AI should **always continue from this document** instead of redesigning previous work.

---

# Project Status

```text
Module 0  — Core Infrastructure         DONE
Module 1  — Products                    DONE
Module 2  — Orders                      DONE
Module 3  — Customers                   DONE (Phases 1-3; no Phase 4 scheduled)
Module 4  — Reviews                     DONE (all 6 phases)
Module 5  — Coupons & Discounts         DONE (all 6 phases)
Module 6  — Inventory                   NOT STARTED — next up
Module 7  — Categories                  NOT STARTED
Module 8  — Brands                      NOT STARTED
Module 9  — Marketing                   NOT STARTED
Module 10 — CMS                         NOT STARTED
Module 11 — Analytics                   NOT STARTED
Module 12 — Settings                    NOT STARTED
Module 13 — Roles & Permissions         NOT STARTED
```

## ✅ Module 0 — Core Infrastructure (Completed)

Foundation shared by every module.

Includes:

- Authentication
- Authorization
- RBAC
- Audit logging
- DataTable
- URL State
- Bulk Action framework
- Toast system
- Confirm Dialog
- Shared cards
- Shared layout
- Shared formatting helpers
- Shared loading/error states
- Shared admin architecture

No future module should duplicate any of these systems.

Always reuse them.

---

# ✅ Module 1 — Products (Completed)

Fully implemented.

Includes

- Product List
- Filters
- Search
- Pagination
- Sorting
- Product Detail
- Product Editing
- Status management
- Delete / Restore
- Bulk actions
- Audit Timeline
- Internal Notes
- Media management
- Permissions
- Optimistic UI
- Concurrency protection

This module is considered the architectural reference.

---

# ✅ Module 2 — Orders (Completed)

Fully implemented.

Includes

- Storefront checkout
- Admin order list
- Advanced filters
- Customer search
- Detail page
- Status transitions
- Payment transitions
- Fulfillment transitions
- Centralized transition engine
- Timeline
- Internal notes
- Bulk actions
- Customer service tools
- Email abstraction
- Storefront order history
- Customer-facing status display
- Architecture review & cleanup

All formatting and transition logic are centralized.

---

# ✅ Module 3 — Customers (Completed)

Current status:

Phases 1–3 completed (Architecture, Customer List, Customer Detail),
including a follow-up query-efficiency/index review. See below.

Deferred features (Internal Notes, Customer Timeline, Groups, Segments,
Marketing Tags, Guest/Registered unification) remain unscheduled — see
"Future (Not Part of Initial Module)" below. There is no Phase 4 for
Customers, and none is planned — this module is complete for the
purposes of this roadmap unless one of the deferred features is
explicitly scheduled in the future.

---

## Goal

Build a read-focused Customer Management module.

Customers are registered users.

Guest customers remain accessible through the Orders module.

---

## Architecture Rules

Reuse:

- DataTable
- FormCard
- DetailField
- Badge
- Breadcrumbs
- URL State
- Audit wrappers
- Permission wrappers
- formatMoney()
- Order badges
- Order formatting
- Existing loading/error conventions

Do NOT:

- duplicate status labels
- duplicate formatting
- duplicate order components
- touch authentication
- touch storefront account pages

---

## Phase 1

Architecture Review

✅ Completed

---

## Phase 2

Customer List

✅ Completed

Implemented:

- `lib/customers/admin.ts`
- `app/admin/customers/page.tsx`
- `app/admin/customers/loading.tsx`
- `app/admin/customers/error.tsx`
- `app/admin/customers/components/CustomerTable.tsx`
- `customers:view` permission

Build:

- customers:view permission
- lib/customers/admin.ts
- searchable list
- pagination
- filters
- sorting
- aggregate metrics

Columns

- Name
- Email
- Joined
- Orders Count
- Lifetime Spend
- Last Order

Sorting

Allowed:

- Name
- Email
- Joined

Not required:

- Lifetime Spend
- Orders Count

---

## Phase 3

Customer Detail

✅ Completed

Implemented:

- `lib/customers/detail.ts`
- `app/admin/customers/[id]/page.tsx`
- `app/admin/customers/[id]/loading.tsx`
- `app/admin/customers/[id]/error.tsx`
- `app/admin/customers/components/cards/StatisticsCard.tsx`
- `app/admin/customers/components/cards/RecentOrdersCard.tsx`

Build:

- Profile Card
- Customer information
- Customer statistics
- Embedded Order History

Reuse directly:

- OrderStatusBadge
- PaymentStatusBadge
- FulfillmentStatusBadge

Never recreate them.

Statistics rule (do not silently change):

- Purchasing statistics — order count, total/average spend, first/last
  order date — **exclude** `CANCELLED` orders. They represent actual
  purchasing activity.
- The embedded Recent Orders activity table **includes** `CANCELLED`
  orders — it represents customer activity/history, not only successful
  purchases.

### Phase 3 follow-up — query-efficiency / index review

✅ Completed (commits `116757d`, `c830ef1` — 2 commits ahead of
`origin/main`, not yet pushed)

`Order`'s standalone `userId` index was replaced with a composite
`(userId, createdAt)` index. Customer Detail's recent-orders query
filters by `userId` and sorts by `createdAt`, which the composite index
serves directly instead of an indexed filter followed by an in-memory
sort. Migration:
`prisma/migrations/20260601000000_order_userid_createdat_index/migration.sql`.

Verified against every `Order` query in the codebase that filters by
`userId` (four total) — the composite index fully subsumes the
standalone index it replaced for all of them, with no regression case:

- `lib/customers/detail.ts` recent-orders query (the query that
  motivated the change) — filter `userId`, sort `createdAt` desc.
- `lib/orders/storefront.ts`'s `getOrdersByUserId` (storefront account
  order history) — same filter/sort shape, unbounded (no `take`) — a
  second real beneficiary, not just Customer Detail.
- `lib/customers/admin.ts`'s `groupBy` (Phase 2 Customer List
  aggregate) — `userId IN(...)` + status filter, no sort — served
  equally well by the composite index's leading column.
- `lib/customers/detail.ts`'s stats `aggregate` — `userId` + status
  filter, no sort — same as above.

**Not yet verified against a live Postgres instance** — proofread only,
same caveat as the Module 2 migration (see `DATABASE.md`). Run
`npm run db:migrate` against a real database before treating it as
fully verified.

---

## Future (Not Part of Initial Module)

Potential additions — unscheduled, not an approved phase. Do not treat
any of these as an implicit "Phase 4" for Customers; they require an
explicit decision to schedule before implementation.

- Internal Notes
- Customer Timeline
- Customer Groups
- Customer Segments
- Marketing Tags
- Guest/Registered unification

---

# 📋 Planned Future Modules

The following modules should be implemented **after Customers**, in order.

---

# ✅ Module 4 — Reviews (Completed)

Purpose

Customer product reviews.

All six phases completed:

- Phase 1 — Architecture ✅
- Phase 2 — Review List + client submission infrastructure ✅
- Phase 3 — Review Detail ✅
- Phase 4 — Moderation (Approve / Reject / Spam) ✅
- Phase 5 — Bulk moderation ✅
- Phase 6 — Timeline ✅

Key implementation notes for future modules to reuse or reference:

- `Review` model: `productId` required (RESTRICT — a review's subject
  IS the product, unlike `OrderItem.productId`'s SetNull), `orderItemId`
  NOT unique (duplicate rule is `@@unique([userId, productId])`, not
  per-purchase). `permanentlyDeleteProduct` was extended with a
  precondition check refusing hard-delete while reviews exist.
- Moderation lifecycle: `PENDING → {APPROVED, REJECTED, SPAM}`, with
  `REJECTED`/`SPAM` only correctable back through `PENDING` (never
  directly into each other or into `APPROVED`). See `lib/reviews/status.ts`.
- Permissions: `reviews:view` (Staff+), `reviews:moderate` (Manager+).
- Bulk moderation reuses the exact same audit action names as
  single-record moderation (`review.approve`, `review.reject`, etc.) —
  a deliberate difference from Orders' `order.bulk_status_*` convention.
  This required extending `lib/admin/bulk-actions.ts`'s
  `BulkMutationOutcome` with an optional `metadataById` field (purely
  additive — existing Orders/Products bulk actions are unaffected) so
  each row's audit entry can carry its own `{from, to}`, since a single
  bulk action can pull eligible rows from more than one origin status.
- Timeline (`lib/reviews/timeline.ts`) tells a bulk-originated entry
  apart from a single-record one via `metadata.batchSize`'s presence,
  not a different action name (since the action names are shared).

Reusable infrastructure this module added:

- `lib/reviews/{admin,detail,status,eligibility,storefront,timeline}.ts`
- `ReviewStatusBadge`, `ReviewTable`/`ReviewFilters`, moderation +
  bulk-moderation UI patterns, `ReviewTimeline`

---

# ✅ Module 5 — Coupons & Discounts (Completed)

One unified system — a Coupon IS the discount mechanism (always
code-based); there is no separate "Discounts" concept. The stale
separate "Discounts" nav entry was collapsed into "Coupons" in
`lib/admin/nav.ts`.

All six phases completed:

- Phase 1 — Architecture ✅
- Phase 2 — Coupon List + checkout redemption infrastructure ✅
- Phase 3 — Coupon Create/Edit ✅
- Phase 4 — Usage Tracking ✅
- Phase 5 — Bulk Actions ✅
- Phase 6 — Audit Timeline ✅

Key implementation notes for future modules to reuse or reference:

- `Coupon` model: `code` unique/normalized-uppercase, whole-dollar
  integers throughout (`discountValue`, `minOrderValue` — this project
  has not adopted cents precision, see `lib/money.ts`), a conditional
  DB `CHECK` on `discountValue` (1–100 for `PERCENTAGE`, `>0` for
  `FIXED_AMOUNT`). `usageCount` is server-only, never client-writable,
  incremented atomically inside `createOrder`'s transaction.
- No `CouponRedemption` model — every "usage tracking" fact (which
  order, when, which customer) is derived from `Order.couponId` joined
  against Order's existing fields. `Order.couponId` is nullable/SetNull
  (a coupon is a supporting reference, not the order's subject, unlike
  `Review.productId`).
- `Order.discountTotal`/`total` are populated by coupon redemption;
  `OrderItem.discount` is a separate, still-unused per-line mechanism —
  deliberately untouched by this module.
- Status lifecycle: `DRAFT ↔ ACTIVE ↔ ARCHIVED`, fully permissive
  (mirrors `ProductStatus`, not Reviews' funnel-through-PENDING model).
  Archiving IS this module's only "delete" — no `coupons:delete`/
  `coupons:restore` capability exists.
- Permissions: `coupons:view` (Staff+), `coupons:create`/`coupons:edit`
  (Manager+). The Coupon Detail page (`/admin/coupons/[id]`) is gated at
  `coupons:view` (not `coupons:edit`) since it also carries read-only
  usage/redemption/timeline data — a Staff-only viewer sees the edit
  form fully disabled. `coupons:edit` remains the actual mutation
  boundary, enforced independently server-side.
- Bulk actions use `coupon.bulk_status_<status>` audit action names
  (distinct per target, unlike Reviews' shared-name convention) with
  per-row `{from, to}` metadata via the same `metadataById` mechanism
  Reviews' Phase 5 added to `lib/admin/bulk-actions.ts`.

Reusable infrastructure this module added:

- `lib/coupons/{admin,detail,status,redemption,timeline}.ts`,
  `app/admin/coupons/validators.ts`
- `CouponEffectiveStateBadge` (derived display state, separate from the
  persisted `status` enum — `getCouponEffectiveState` combines `status`
  + `startsAt`/`endsAt`, never auto-transitions anything)
- Checkout coupon-code apply/remove UI
  (`components/checkout/CouponCodeInput.tsx`)

---

# Module 6 — Inventory

### Phase 1

Architecture

### Phase 2

Stock Dashboard

### Phase 3

Stock Movements

### Phase 4

Warehouses

### Phase 5

Low Stock Alerts

### Phase 6

Bulk Adjustments

### Phase 7

Timeline

---

# Module 7 — Categories

### Phase 1

Architecture

### Phase 2

Tree View

### Phase 3

Create/Edit

### Phase 4

Bulk Actions

### Phase 5

Timeline

---

# Module 8 — Brands

### Phase 1

Architecture

### Phase 2

CRUD

### Phase 3

Media

### Phase 4

Bulk Actions

### Phase 5

Timeline

---

# Module 9 — Marketing

### Phase 1

Architecture

### Phase 2

Banners

### Phase 3

Homepage Sections

### Phase 4

Featured Collections

### Phase 5

Announcements

### Phase 6

Scheduling

---

# Module 10 — CMS

### Phase 1

Architecture

### Phase 2

Pages

### Phase 3

Blog

### Phase 4

Authors

### Phase 5

SEO

### Phase 6

Media

---

# Module 11 — Analytics

### Phase 1

Architecture

### Phase 2

Dashboard

### Phase 3

Revenue

### Phase 4

Customers

### Phase 5

Products

### Phase 6

Reports

---

# Module 12 — Settings

### Phase 1

General Settings

### Phase 2

Store Settings

### Phase 3

Email Settings

### Phase 4

Payment Settings

### Phase 5

Shipping Settings

### Phase 6

Tax Settings

### Phase 7

SEO Settings

### Phase 8

Maintenance

---

# Module 13 — Roles & Permissions

(Current RBAC exists.)

This module becomes the management UI.

### Phase 1

Architecture

### Phase 2

Roles

### Phase 3

Permissions

### Phase 4

Assignment

### Phase 5

Audit

---

# Global Rules

Every future module MUST follow these principles.

## Never duplicate business logic.

If something already exists:

Reuse it.

---

## Every mutation must use

Permission

↓

Validation

↓

Business Rules

↓

Audited Mutation

↓

Revalidate Paths

---

## Formatting

Formatting helpers belong in shared libraries.

Never duplicate:

- dates
- money
- statuses
- labels

---

## Components

If an existing component solves the problem:

Reuse it.

Do not rebuild it.

---

## Permissions

Never introduce new permissions unless absolutely required.

Reuse existing permissions whenever possible.

---

## Audit

Every meaningful mutation must be audited.

No-op actions should not create audit entries.

---

## UI

Follow the exact design language established by:

- Products
- Orders

Customers becomes the third reference implementation.

Future modules should follow the same patterns.

---

# AI Instructions

Before writing code:

1. Read this document.
2. Read `docs/admin-module-guide.md`.
3. Review previous modules.
4. Identify reusable infrastructure.
5. Avoid duplication.
6. Build only the current phase.
7. Finish each phase with:
   - lint
   - typecheck
   - build
   - architecture review
8. Never silently redesign previous modules.
9. If a major architectural decision is required, stop and document it before implementing.

---

# Current Task

**Next implementation target:**

> **Module 6 — Inventory**
>
> Module 3 — Customers is done (Phases 1–3, no Phase 4 scheduled).
> Module 4 — Reviews is done (all six phases). Module 5 — Coupons &
> Discounts is done (all six phases). See each module's section above
> for the key implementation decisions and reusable infrastructure a
> new module should reference before adding anything of its own.
>
> Begin with **Phase 1 — Architecture** for Inventory (see Module 6
> section above — it has 7 phases, not 6: Architecture, Stock
> Dashboard, Stock Movements, Warehouses, Low Stock Alerts, Bulk
> Adjustments, Timeline) before any implementation.
