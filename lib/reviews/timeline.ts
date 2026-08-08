import "server-only";
import { prisma } from "@/lib/prisma";
import { REVIEW_STATUS_META } from "@/lib/reviews/status";
import type { ReviewStatus } from "@prisma/client";

/**
 * The Review timeline IS the AuditLog, filtered to this review and
 * formatted for display — not a separate table, same approach as
 * lib/orders/timeline.ts. No `isNote` field the way Orders' entry type
 * has one: Reviews have no internal-notes feature, so every entry here
 * is plain activity.
 */
export type ReviewTimelineEntry = {
  id: string;
  createdAt: Date;
  /** Always a real authenticated actor for Reviews — submission requires
   *  login (Phase 2) and moderation requires reviews:moderate (Phase 4),
   *  unlike Orders' guest-checkout case, so no "(guest)" suffix logic is
   *  needed here. */
  actorLabel: string;
  title: string;
  /** Extra detail line — "Pending → Approved" for a moderation
   *  transition, with a bulk note appended when the entry came from a
   *  bulk action. Null for review.create, which needs no further detail. */
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
  return REVIEW_STATUS_META[value as ReviewStatus]?.label ?? value;
}

const ACTION_TITLES: Record<string, string> = {
  "review.create": "Review submitted",
  "review.approve": "Approved",
  "review.reject": "Rejected",
  "review.spam": "Marked as spam",
  "review.reset_to_pending": "Reset to pending",
};

function formatEntry(row: AuditLogRow): ReviewTimelineEntry {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const base = { id: row.id, createdAt: row.createdAt, actorLabel: row.actorEmail };

  const from = typeof metadata.from === "string" ? metadata.from : undefined;
  const to = typeof metadata.to === "string" ? metadata.to : undefined;
  // Present only on entries written by a Phase 5 bulk action (see
  // lib/admin/bulk-actions.ts's metadataById + batchSize) — single-record
  // Phase 4 transitions never set this. Reviews' bulk actions reuse the
  // exact same action strings as their single-record counterparts (per
  // the approved architecture), so batchSize's presence — not a
  // different action name, unlike Orders' order.bulk_status_* pattern —
  // is how a bulk-originated entry is told apart here.
  const batchSize = typeof metadata.batchSize === "number" ? metadata.batchSize : undefined;

  let description: string | null = null;
  if (from && to) {
    description = `${statusLabel(from)} → ${statusLabel(to)}`;
    if (batchSize) {
      description += ` — bulk update, ${batchSize} review${batchSize === 1 ? "" : "s"} changed together.`;
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
 * Bounded per-review via the existing (entityType, entityId) composite
 * index on AuditLog — no new index, no new model.
 */
export async function getReviewTimeline(reviewId: string): Promise<ReviewTimelineEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entityType: "Review", entityId: reviewId },
    orderBy: { createdAt: "desc" },
    select: { id: true, actorEmail: true, action: true, metadata: true, createdAt: true },
  });
  return rows.map(formatEntry);
}
