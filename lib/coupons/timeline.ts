import "server-only";
import { prisma } from "@/lib/prisma";
import { COUPON_STATUS_META } from "@/lib/coupons/status";
import type { CouponStatus } from "@prisma/client";

/**
 * The Coupon timeline IS the AuditLog, filtered to this coupon and
 * formatted for display — not a separate table, same approach as
 * lib/orders/timeline.ts and lib/reviews/timeline.ts. Read-only: this
 * file only queries and formats existing AuditLog rows, it never writes
 * anything (Coupon, usageCount, Order, OrderItem, or AuditLog itself).
 * Order events are deliberately not mixed in — this timeline is about
 * the Coupon entity only, same as how Review's timeline doesn't pull in
 * Order events despite a Review being purchase-linked too.
 */
export type CouponTimelineEntry = {
  id: string;
  createdAt: Date;
  actorLabel: string;
  title: string;
  description: string | null;
};

type AuditLogRow = {
  id: string;
  actorEmail: string;
  action: string;
  metadata: unknown;
  createdAt: Date;
};

function statusLabel(value: string): string {
  return COUPON_STATUS_META[value as CouponStatus]?.label ?? value;
}

const ACTION_TITLES: Record<string, string> = {
  "coupon.create": "Coupon created",
  "coupon.update": "Coupon updated",
  "coupon.bulk_status_draft": "Bulk status change",
  "coupon.bulk_status_active": "Bulk status change",
  "coupon.bulk_status_archived": "Bulk status change",
};

function formatEntry(row: AuditLogRow): CouponTimelineEntry {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const base = { id: row.id, createdAt: row.createdAt, actorLabel: row.actorEmail };

  let description: string | null = null;

  if (row.action === "coupon.create") {
    // metadata: { code, status } — see app/admin/coupons/actions.ts's
    // createCoupon. Code isn't repeated here since the page header
    // already shows it for every entry on this timeline.
    const status = typeof metadata.status === "string" ? metadata.status : undefined;
    description = status ? `Status: ${statusLabel(status)}` : null;
  } else if (row.action === "coupon.update") {
    // metadata: { code, status, previousStatus } — see updateCoupon.
    // Only a status field is tracked in metadata, so a description is
    // only shown when the status actually changed; a same-status edit
    // (e.g. discountValue only) has no extra detail to claim.
    const status = typeof metadata.status === "string" ? metadata.status : undefined;
    const previousStatus =
      typeof metadata.previousStatus === "string" ? metadata.previousStatus : undefined;
    if (status && previousStatus && status !== previousStatus) {
      description = `${statusLabel(previousStatus)} → ${statusLabel(status)}`;
    }
  } else if (row.action.startsWith("coupon.bulk_status_")) {
    // metadata: { from, to, batchId, batchSize } — from/to are per-row
    // (lib/admin/bulk-actions.ts's metadataById, set in
    // app/admin/coupons/actions.ts's bulkSetCouponStatus), so this must
    // read each entry's own from/to rather than assume every row in a
    // batch shared the same origin status — a single bulk action (e.g.
    // "Archive") can legally pull eligible rows from more than one
    // status under Coupon's fully-permissive lifecycle.
    const from = typeof metadata.from === "string" ? metadata.from : undefined;
    const to = typeof metadata.to === "string" ? metadata.to : undefined;
    const batchSize = typeof metadata.batchSize === "number" ? metadata.batchSize : undefined;
    if (from && to) {
      description = `${statusLabel(from)} → ${statusLabel(to)}`;
      if (batchSize) {
        description += ` — bulk update, ${batchSize} coupon${batchSize === 1 ? "" : "s"} changed together.`;
      }
    }
  }

  return {
    ...base,
    // Forward-compatible fallback for any action this file hasn't been
    // taught about yet, same as lib/orders/timeline.ts's default case.
    title: ACTION_TITLES[row.action] ?? row.action,
    description,
  };
}

/**
 * Newest first, matching every other module's timeline convention.
 * Bounded per-coupon via the existing (entityType, entityId) composite
 * index on AuditLog — no new index, no new model, no migration.
 */
export async function getCouponTimeline(couponId: string): Promise<CouponTimelineEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entityType: "Coupon", entityId: couponId },
    orderBy: { createdAt: "desc" },
    select: { id: true, actorEmail: true, action: true, metadata: true, createdAt: true },
  });
  return rows.map(formatEntry);
}
