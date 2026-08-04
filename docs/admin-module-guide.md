# Admin Module Guide

Products (`app/admin/products/`) is the reference implementation for every
admin CRUD module. This document describes the patterns it established so
that Categories, Collections, Brands, Customers, Orders, Coupons, Reviews,
Analytics, and Settings all come out consistent with it — and with each
other — instead of drifting into parallel implementations.

If you're building a new module and a situation isn't covered here, look at
how Products solved it before inventing something new. If Products genuinely
doesn't have an answer, extend the shared infrastructure rather than
building a local workaround.

---

## 1. Folder organization

A module's admin surface lives under `app/admin/<module>/` and mirrors this
shape (Products shown, plural route segment):

```
app/admin/products/
  page.tsx                    # List view (Server Component)
  loading.tsx
  error.tsx
  actions.ts                  # Server Actions: create + bulk actions + module-specific mutations
  validators.ts                # Zod schema(s) + shared validation helpers
  types.ts                     # Client-facing form/state types
  new/
    page.tsx                   # Create view
    loading.tsx
  [id]/
    page.tsx                   # Edit view (Server Component)
    actions.ts                 # Server Actions: update/delete/restore/permanently-delete
    loading.tsx
    error.tsx
  components/
    <Module>Form.tsx            # Client form shell (mode: "create" | "edit")
    <Module>Table.tsx            # DataTable wiring: columns + bulk actions
    <Module>Filters.tsx
    <Module>StatusBadge.tsx
    <Module>RowActions.tsx
    Delete<Module>Button.tsx
    use<Module>Form.ts            # useReducer-based form state hook
    <module>-form-state.ts        # Hydration: DB row → form state (see §6)
    cards/
      GeneralCard.tsx
      ...one file per form section
```

Business logic and data access do **not** live under `app/admin/`. They live
in `lib/<module>/`, mirroring `lib/products/`:

```
lib/products/
  admin.ts          # Admin queries (list/detail) + ref resolution (category/collection/tag)
  storefront.ts      # Public-facing queries
  status.ts          # Status transitions + publish requirements
  availability.ts     # Domain-specific helper
```

**Rule of thumb:** `app/admin/<module>/` is presentation and orchestration
(Server Components calling `lib/`, Server Actions calling `lib/`). `lib/<module>/`
is where Prisma queries and domain rules actually live. Nothing under
`app/` should contain raw `prisma.*` calls sprinkled through component
logic — route them through `lib/`.

---

## 2. Server action pattern

No REST layer for internal admin operations. Every mutation is a Server
Action (`"use server"`) exported from `actions.ts` (list-level + bulk) or
`[id]/actions.ts` (record-level: update/delete/restore/permanently-delete).

Shape every single-record mutation the same way, in this order:

1. **Permission gate first**, before any database read — see §3. This is
   the fail-closed ordering: an unauthorized caller should never trigger a
   business-logic query.
2. **Validate input** with the Zod schema from `validators.ts`.
3. **Domain preconditions** — status transition legality, publish
   requirements, uniqueness checks (slug/SKU-equivalent), staleness check
   (`assertNotStale`, §5) — each returning a typed failure result, not
   throwing.
4. **The actual mutation**, wrapped in `withAuditedMutation` (§4), doing
   the Prisma write (in a `$transaction` if it touches more than one
   table/relation) and any `revalidatePath` calls.

```ts
"use server";

export async function deleteWidget(id: string): Promise<SimpleActionResult> {
  const authError = await checkPermission("widgets:delete");
  if (authError) return authError;

  const existing = await prisma.widget.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) return { success: false, error: "This widget no longer exists." };

  return withAuditedMutation(
    "widgets:delete",
    { action: "widget.delete", entityType: "Widget" },
    async () => {
      await prisma.widget.update({ where: { id }, data: { deletedAt: new Date() } });
      revalidatePath("/admin/widgets");
      return { result: { success: true as const }, entityId: id, metadata: { name: existing.name } };
    }
  );
}
```

Return types are discriminated unions the client can branch on directly —
never throw for an expected/user-facing failure (bad input, stale record,
missing permission, business rule violation). Reserve thrown errors for
genuinely unexpected conditions.

---

## 3. Permission wrappers

All permission logic lives in `lib/admin/auth.ts` and `lib/admin/permissions.ts`.
Never write an ad hoc role check anywhere else.

- **`can(role, capability)`** (`lib/admin/permissions.ts`) — the single
  role → capability lookup. Add your module's capabilities to the
  `Capability` union and to each role's array in `ROLE_CAPABILITIES`.
  Follow the existing naming convention: `"<module>:view"`,
  `"<module>:create"`, `"<module>:edit"`, `"<module>:delete"`,
  `"<module>:restore"`, `"<module>:permanently_delete"` — only include the
  ones that make sense for the module (e.g. Orders likely has no
  `:permanently_delete`).
- **`requirePageAccess(capability)`** — call at the top of every `page.tsx`.
  Redirects (`/login` if unauthenticated, `/` if authenticated but
  lacking the capability). Never build a bespoke `/admin/forbidden` page.
- **`checkPermission(capability)`** — call as the first line of a Server
  Action that needs to do additional work (uniqueness checks, staleness
  checks) before its audited mutation. Returns `null` if permitted,
  otherwise the standard `{ success: false, error }` shape to return
  immediately. This is what keeps single-record actions fail-closed in the
  same order bulk actions already are.
- **`withPermission(capability, handler)`** — for actions that check a
  capability but aren't a mutation worth auditing (e.g. a read triggered by
  a POST, generating an export).
- **`assertAnyPermission` / `withAnyPermission`** — when an action is valid
  under more than one capability (e.g. media upload is legitimate during
  either Create or Edit).

**Every Server Action must be gated.** A page-level `requirePageAccess`
check is not sufficient on its own — Server Actions are directly callable
and must independently verify permission.

---

## 4. Audit wrappers

Defined in `lib/audit.ts` and `lib/admin/bulk-actions.ts`. Every mutation —
create, update, delete, restore, permanently delete, bulk variants — goes
through one of these. This is what makes "every mutation is audited" a
structural guarantee instead of a convention someone forgets.

- **`withAuditedMutation(capability, { action, entityType }, handler)`** —
  single-record mutations. Checks the capability, runs `handler`, writes
  one `AuditLog` row from whatever `{ result, entityId, metadata }` the
  handler returns. `entityId` is read from the handler's result (not
  required upfront) so a Create action can log the id it just generated.
  Keep `metadata` small — changed fields or a short summary, not full
  before/after snapshots.
- **`withAuditedBulkMutation(capability, { action, entityType }, handler)`**
  — bulk mutations. Checks the capability once, runs `handler` (which is
  responsible for doing its own batched queries — no N+1 mutations), then
  writes one `AuditLog` row per successfully affected entity via a single
  `createMany`, tagged with a shared `batchId`. The handler returns
  `{ affectedIds, skipped? }`; `skipped` entries `{ id, reason }` become the
  toast the admin sees for anything selected-but-ineligible.

Action naming convention: `"<module>.<verb>"` (`product.create`,
`product.bulk_status_active`, `product.permanently_delete`). Keep it
consistent so audit log filtering/search works across modules.

---

## 5. Concurrency pattern

`lib/admin/concurrency.ts` — `assertNotStale(submittedUpdatedAt, currentUpdatedAt)`.

Every editable resource carries its `updatedAt` through the edit form as a
hidden concurrency token (see `ProductFormState.updatedAt` in §6). On
submit, the update action re-reads the row's current `updatedAt` and calls
`assertNotStale` **before** opening the mutation transaction — so a
staleness rejection is never confused with (or masked by) an actual write
failure. If it throws `ConcurrencyError`, return a `conflict: true` result
with a message telling the admin to reload.

```ts
const existing = await prisma.widget.findFirst({ where: { id, deletedAt: null }, select: { updatedAt: true } });
try {
  assertNotStale(updatedAt, existing.updatedAt);
} catch (error) {
  if (error instanceof ConcurrencyError) {
    return { success: false, conflict: true, formError: "This record was changed by someone else…" };
  }
  throw error;
}
```

Every editable module reuses this exact helper — don't write a parallel
`if (submitted !== current)` check.

---

## 6. Form hydration (`<module>-form-state.ts` pattern)

Hydration/transformation logic — converting a loaded DB row (with its
relations) into the client form's string-based state shape, and back — is
kept in its own file, separate from components, hooks, and server actions.
For Products this is `app/admin/products/components/product-form-state.ts`.

Why it's a separate file: the form works entirely in strings (`price:
string`, not `number`) because `<input>` values are strings and Zod's
`z.coerce` handles the numeric conversion at submit time — but the
database and the create/read queries deal in real types (`number`, `Date`,
relations). One file owns that boundary:

```ts
export function widgetToFormState(widget: AdminWidgetDetail): WidgetFormState {
  return {
    name: widget.name,
    price: String(widget.price),
    updatedAt: widget.updatedAt.toISOString(),
    category: widget.category ? { kind: "existing", id: widget.category.id } : null,
    // ...
  };
}
```

Rules this file follows:

- Never coerce "not set" into a default value that means something
  different (e.g. an empty `compareAtPrice` becomes `""`, not `"0"` — `0`
  is a real price, `""`/`undefined` means "no compare-at price
  configured").
- Reference/relation fields (category, collections, tags-equivalents) load
  as `{ kind: "existing", id }` — see `organizationRefSchema` in §7 for why.
- Any field representing "this is a live, already-published record" (like
  `slugManuallyEdited: true` for Products) should be set defensively on
  hydration so editing an existing record can't silently trigger
  auto-derivation logic meant only for brand-new records.
- The empty/default state for **Create** mode is defined separately
  (`emptyProductForm` lives in `useProductForm.ts`, not in the hydration
  file) — hydration only ever runs for Edit.

Pair this with a `use<Module>Form.ts` hook: a `useReducer` over the form
state, with typed actions for each field/group of fields. Put any
derived-field logic (e.g. auto-slug-from-name until the admin edits the
slug directly) in the reducer, not in the component.

---

## 7. Validation

`validators.ts` per module, built on Zod. Patterns to reuse directly:

- **`optionalNonNegativeInt()`** — the `z.preprocess` pattern in
  `app/admin/products/validators.ts` that treats `""` as "not set"
  (`undefined`) rather than coercing to `0`. Reuse this exact pattern for
  any optional numeric field.
- **`organizationRefSchema`** — the `{ kind: "existing", id } | { kind:
  "new", name }` union for any picker that lets the admin either choose an
  existing related row or type a brand-new one inline (categories,
  collections, tags today). Resolved into a real row id at save time by a
  `resolve<Thing>Ref(s)` function in the module's `lib/<module>/admin.ts`
  (upsert-by-slug, called inside the same transaction as the create/update
  so a failed save can't leave orphan rows behind — see
  `resolveCategoryRef`/`resolveCollectionRefs`/`resolveTagRefs`).
- **`mediaItemSchema`** — reuse as-is for any module with media (see §10);
  don't redefine media shape per module.
- **Status-dependent requirements** live in the module's `status.ts`
  (`getStatusRequirements`), not inline in the validator or the action —
  see §11.
- Use `zodIssuesToFieldErrors` (`lib/zod-errors.ts`) to turn a
  `safeParse` failure into the `Partial<Record<string, string>>` shape the
  form's error state expects. Don't hand-roll this per module.

---

## 8. DataTable usage

`components/admin/ui/DataTable.tsx` is the shared table for every module's
list view. It runs in **manual server mode** — pagination, sorting,
filtering, and search are all URL-driven (`lib/admin/url-state.ts`) and
resolved server-side in the module's `lib/<module>/admin.ts` query
(`getAdminProducts`-equivalent). `DataTable` itself never fetches; it just
renders whatever page of data its Server Component parent already loaded.

To wire up a new module's table:

1. Write a `<Module>Table.tsx` client component (see
   `ProductTable.tsx`) that defines `ColumnDef[]` via `useMemo` and renders
   `<DataTable columns={...} data={...} getRowId={(row) => row.id} .../>`.
2. Pass `page`, `pageCount`, `pageSize`, `totalCount` straight through from
   the query result.
3. Pass permission booleans (`canDelete`, `canEdit`, etc.) down from the
   `page.tsx` Server Component (`can(user.role, "<module>:edit")`) — never
   compute permission inside a client component.
4. Row selection is entirely internal to `DataTable` and resets
   automatically whenever the `data` prop changes identity — i.e. on every
   pagination/sort/filter/search navigation, and after any
   `router.refresh()` a bulk/row action triggers. You don't need to manage
   this yourself; just make sure your query always returns a fresh array
   (it will, since it's a fresh Prisma query per request).
5. Reuse `DataTableColumnHeader` for any sortable column (`sortKey` must
   match a whitelisted column in the module's query — see
   `SORTABLE_COLUMNS` in `lib/products/admin.ts`; **never** pass a raw URL
   param straight into Prisma's `orderBy` key).

---

## 9. Bulk actions

`components/admin/ui/BulkActionBar.tsx` renders automatically inside
`DataTableToolbar` whenever selection is non-empty and the table was given
`bulkActions`. Define a module's bulk actions as an array of `BulkAction`
(`{ id, label, variant?, confirm?, run }`) inside the `<Module>Table.tsx`
component, computed with `useMemo` from the permission flags passed in.

Every bulk action's server function:

- Wraps its handler in `withAuditedBulkMutation` (§4).
- Computes eligibility with the **same** rule the single-record action
  uses (e.g. `canTransitionTo` / `getStatusRequirements` from the module's
  `status.ts`) — never a separately-drifting copy of that logic.
- Uses batched `updateMany`/`deleteMany` queries, not a per-id loop.
- Returns per-id `skipped` reasons for anything selected-but-ineligible so
  the toast can say *why* (`"3 skipped — Missing category (+2 more)"`).
- For destructive bulk actions (delete, permanent delete), set `confirm`
  on the `BulkAction`, and use `requireTextMatch` for irreversible ones
  (`DELETE ${count} WIDGETS`) the same way `bulkPermanentlyDeleteProducts`
  does.

---

## 10. Media abstraction

`lib/media/` is provider-agnostic. `lib/media/types.ts` defines the
`MediaProvider` interface and `UploadedMedia`/`UploadOptions` shapes;
`lib/media/index.ts` exports `uploadMedia`/`deleteMedia`, which delegate to
whichever provider is currently assigned (Cloudinary today, in
`lib/media/providers/cloudinary.ts`).

**Nothing outside `lib/media/` may import a provider file directly or
reference a provider-specific concept.** If a future module needs media
(Reviews with photo attachments, for example), it calls `uploadMedia` /
`deleteMedia` from `lib/media`, stores the returned `providerId` (opaque —
never parsed or reconstructed outside the provider), and reuses
`mediaItemSchema` from `validators.ts` for the shape. Do not add a second
media pipeline or a module-specific upload action pattern — follow
`uploadProductMedia`/`removeProductMedia` in `app/admin/products/actions.ts`
as the template: upload immediately on drag/drop (independent of the
record's Save), keep the URL in form state, and reconcile DB rows
(create/update/delete `ProductMedia`-equivalent rows) inside the record's
own update transaction.

---

## 11. Status management

Centralized per-module in `lib/<module>/status.ts` — see
`lib/products/status.ts` as the template. One file owns:

- The status enum's UI metadata (`label`, `description`) and badge variant.
- **`getAllowedTransitions` / `canTransitionTo`** — which status can move
  to which. Even if every transition is currently allowed, define this
  explicitly rather than skipping it: it's the single place a future rule
  ("can't un-archive without a manager") gets implemented once, and every
  call site (single-record update, bulk status-change action) picks it up
  automatically.
- **`getStatusRequirements(to, values)`** — extra field requirements
  enforced only when transitioning *to* a particular status (e.g.
  Products requires a category, at least one photo with alt text, and a
  price > 0 before going `ACTIVE`). Called identically regardless of
  target status so a new requirement on a different status doesn't need
  new call-site logic.

Never duplicate transition or requirement logic in the create action, the
update action, and the bulk action separately — all three call into this
one file.

---

## 12. Verification checklist

Every completed phase/module must be verified before being considered
done. Run, and don't claim something works without having actually run it:

- **Lint** — `npx eslint <changed paths>` (or the whole repo). Zero new
  errors; note any pre-existing/unrelated warnings explicitly rather than
  silently ignoring them.
- **Build** — `npm run build`.
- **Typecheck** — `npx tsc --noEmit`.
- **Database verification** — migration applies cleanly; new/changed
  columns match the Prisma schema; foreign keys have the correct
  `onDelete` behavior (nullable + `SET NULL` for anything that must
  survive deletion of its parent, matching the `OrderItem.productId`
  precedent).
- **Permission verification** — every Server Action gated (page-level
  `requirePageAccess` is not sufficient by itself); every capability used
  actually exists in `ROLE_CAPABILITIES` for the roles that should have
  it.
- **Audit verification** — every create/update/delete/restore/bulk action
  goes through `withAuditedMutation` or `withAuditedBulkMutation`; no
  direct `prisma.auditLog.create` calls outside `lib/audit.ts`.
- **Accessibility review** (where applicable) — interactive controls have
  `aria-label`s where their purpose isn't conveyed by visible text (see
  `Checkbox`, media reorder buttons in `MediaCard.tsx`); form errors use
  `role="alert"`; destructive actions confirm via `ConfirmDialog`.
- **Performance review** (where applicable) — list queries use batched
  `updateMany`/`deleteMany`/`createMany`, not per-row loops; no N+1 queries
  introduced in a list or detail view.

Only implement improvements that provide real value; avoid speculative
architecture and cosmetic-only refactors — the standard Phase 8 held
Products to applies to every module going forward.
