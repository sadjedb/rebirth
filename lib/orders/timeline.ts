import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  FULFILLMENT_STATUS_META,
  type OrderStatusDimension,
} from "@/lib/orders/status";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";

/**
 * The Order timeline IS the AuditLog, filtered to this order and
 * formatted for display — not a separate table. See the Phase 1
 * architecture notes: this is the literal reading of "integrate with the
 * existing audit infrastructure" and "avoid duplicate information."
 * Internal notes are AuditLog entries too (action: "order.note_added"),
 * not a separate Order column — `isNote` is how the UI tells them apart
 * from other timeline activity, nothing more.
 */
export type OrderTimelineEntry = {
  id: string;
  createdAt: Date;
  /** Staff member's email, or "<checkout email> (guest)" for actions
   *  with no authenticated actor (order creation via guest checkout). */
  actorLabel: string;
  title: string;
  /** Extra detail line — e.g. "Pending → Processing" for a status
   *  change, or the note's own text for order.note_added. Null when a
   *  title needs no further detail (e.g. "Order created"). */
  description: string | null;
  isNote: boolean;
};

const DIMENSION_NOUN: Record<OrderStatusDimension, string> = {
  status: "Order status",
  paymentStatus: "Payment status",
  fulfillmentStatus: "Fulfillment status",
};

function labelForDimension(field: OrderStatusDimension, value: string): string {
  switch (field) {
    case "status":
      return ORDER_STATUS_META[value as OrderStatus]?.label ?? value;
    case "paymentStatus":
      return PAYMENT_STATUS_META[value as PaymentStatus]?.label ?? value;
    case "fulfillmentStatus":
      return FULFILLMENT_STATUS_META[value as FulfillmentStatus]?.label ?? value;
  }
}

type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  metadata: unknown;
  createdAt: Date;
};

/**
 * Bulk mutations (Phase 7) share one action name per target value —
 * e.g. "order.bulk_status_completed" — set by
 * app/admin/orders/actions.ts, and go through withAuditedBulkMutation,
 * which only attaches `{ batchId, batchSize }` metadata (see
 * lib/admin/bulk-actions.ts) — not the `{ field, from, to }` shape a
 * single-record transition carries. Matched by pattern rather than one
 * case per possible target value, so a new target enum value never needs
 * a new case here.
 */
const BULK_ACTION_PATTERN = /^order\.bulk_(status|payment_status|fulfillment_status)_([a-z_]+)$/;

const BULK_ACTION_FIELD: Record<string, OrderStatusDimension> = {
  status: "status",
  payment_status: "paymentStatus",
  fulfillment_status: "fulfillmentStatus",
};

function formatEntry(row: AuditLogRow): OrderTimelineEntry {
  const actorLabel = row.actorId ? row.actorEmail : `${row.actorEmail} (guest)`;
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const base = { id: row.id, createdAt: row.createdAt, actorLabel };

  const bulkMatch = row.action.match(BULK_ACTION_PATTERN);
  if (bulkMatch) {
    const field = BULK_ACTION_FIELD[bulkMatch[1]];
    const value = bulkMatch[2].toUpperCase();
    const batchSize = typeof metadata.batchSize === "number" ? metadata.batchSize : undefined;
    return {
      ...base,
      title: `${DIMENSION_NOUN[field]} set to ${labelForDimension(field, value)}`,
      description: batchSize
        ? `Bulk update — ${batchSize} order${batchSize === 1 ? "" : "s"} changed together.`
        : null,
      isNote: false,
    };
  }

  switch (row.action) {
    case "order.create":
      return { ...base, title: "Order created", description: null, isNote: false };

    // All three single-record status-change actions carry the same
    // metadata shape (set uniformly by lib/orders/status.ts's transition
    // resolver: { field, from, to }) — one case handles all three rather
    // than three near-identical blocks.
    case "order.status_changed":
    case "order.payment_status_changed":
    case "order.fulfillment_status_changed": {
      const field = metadata.field as OrderStatusDimension | undefined;
      const from = typeof metadata.from === "string" ? metadata.from : undefined;
      const to = typeof metadata.to === "string" ? metadata.to : undefined;
      return {
        ...base,
        title: field ? `${DIMENSION_NOUN[field]} changed` : "Status changed",
        description: field && from && to ? `${labelForDimension(field, from)} → ${labelForDimension(field, to)}` : null,
        isNote: false,
      };
    }

    case "order.note_added":
      return {
        ...base,
        title: "Note added",
        description: typeof metadata.note === "string" ? metadata.note : null,
        isNote: true,
      };

    // Forward-compatible fallback for any future action this file
    // hasn't been taught about yet — shows something reasonable instead
    // of silently dropping the entry.
    default:
      return { ...base, title: row.action, description: null, isNote: false };
  }
}

/**
 * Newest first, matching the admin's expectation of "what just happened"
 * at the top. Bounded per-order via the (entityType, entityId) composite
 * index already on AuditLog (added Phase 2) — cheap even with millions of
 * audit rows overall, since each order's slice is small.
 */
export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entityType: "Order", entityId: orderId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(formatEntry);
}
