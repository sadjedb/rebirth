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

# 🚧 Module 3 — Customers (Next Module)

Current status:

Architecture approved.

Implementation has NOT started.

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

---

## Future (Not Part of Initial Module)

Potential additions

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

# Module 4 — Reviews

Purpose

Customer product reviews.

### Phase 1

Architecture

### Phase 2

Review List

### Phase 3

Review Detail

### Phase 4

Moderation

- Approve
- Reject
- Spam

### Phase 5

Bulk moderation

### Phase 6

Timeline

---

# Module 5 — Coupons & Discounts

### Phase 1

Architecture

### Phase 2

Coupon List

### Phase 3

Coupon Create/Edit

### Phase 4

Usage Tracking

### Phase 5

Bulk Actions

### Phase 6

Audit Timeline

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

> **Module 3 — Customers**
>
> Begin with **Phase 2 — Customer List** using the approved architecture above.
