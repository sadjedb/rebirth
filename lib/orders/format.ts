import type { OrderStatus } from "@prisma/client";

/**
 * Pure formatting/display helpers with no data access — safe to import
 * from both Server and Client Components. Kept separate from
 * lib/orders/storefront.ts on purpose: that file starts with
 * `import "server-only"`, which makes the *entire module* unimportable
 * from a Client Component, even for functions like these that don't
 * touch the database. OrderTable.tsx (Phase 3, a Client Component) needs
 * formatOrderNumber(), which is exactly the case that pattern breaks.
 */

/** "Order #1042" — the only place this format is defined, reused by the
 *  storefront confirmation/account pages and every admin order view. */
export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber}`;
}

/**
 * Customer-facing copy for OrderStatus. Deliberately separate from (and
 * not a substitute for) the centralized admin transition config in
 * lib/orders/status.ts (Phase 5) — that file owns which transitions are
 * legal and what they do; this is just how the same enum values read on
 * a receipt/account page.
 */
const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order received",
  PROCESSING: "Being prepared",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function customerStatusLabel(status: OrderStatus): string {
  return CUSTOMER_STATUS_LABELS[status];
}

/**
 * "Email sending isn't configured yet" — the one place this message is
 * written, so resend confirmation and resend status email always say the
 * same thing when there's no provider. Lives here, not in
 * app/admin/orders/[id]/actions.ts, because that file has "use server" —
 * every export from a "use server" file must be an async function, so a
 * plain string constant can't be exported from it (this broke the build
 * the first time around: Next.js silently drops the *entire* module's
 * exports when one of them is invalid, not just the offending one).
 */
export const EMAIL_NOT_CONFIGURED_ERROR = "Email sending isn't configured yet.";

/**
 * "Aug 4, 2026, 3:45 PM" — the one place order-related timestamps are
 * formatted for display admin-side (MetadataCard, PaymentCard,
 * OrderTimeline, NotesCard all shared this exact shape independently
 * before being consolidated here). Returns "—" for null so every caller
 * gets consistent empty-state text instead of each inventing its own.
 */
export function formatOrderTimestamp(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
