"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAuditedBulkMutation, type BulkMutationOutcome } from "@/lib/admin/bulk-actions";
import { resolveReviewStatusTransition, REVIEW_STATUS_META } from "@/lib/reviews/status";
import type { ReviewStatus } from "@prisma/client";

function revalidateReviews(ids: string[]) {
  revalidatePath("/admin/reviews");
  for (const id of ids) revalidatePath(`/admin/reviews/${id}`);
}

/** Same action names Phase 4's single-record actions use — a bulk
 *  operation is still, per row, exactly one of these four transitions. */
const BULK_AUDIT_ACTIONS: Record<ReviewStatus, string> = {
  PENDING: "review.reset_to_pending",
  APPROVED: "review.approve",
  REJECTED: "review.reject",
  SPAM: "review.spam",
};

/**
 * Shared by the four bulk actions below — mirrors bulkUpdateOrderStatus's
 * shape in app/admin/orders/actions.ts: re-fetch the selected rows' actual
 * current status fresh (this is the bulk concurrency safeguard — same one
 * Orders' bulk actions rely on, no separate updatedAt token the way the
 * single-record Phase 4 actions use, since there's no client-held stale
 * form value here, just a live selection re-validated against a fresh
 * read immediately before the update), partition into eligible/skipped
 * via the same resolveReviewStatusTransition Phase 4 already uses (never
 * duplicated or bypassed), then one batched updateMany for everything
 * that's actually eligible.
 */
async function bulkChangeReviewStatus(ids: string[], targetStatus: ReviewStatus) {
  return withAuditedBulkMutation(
    "reviews:moderate",
    { action: BULK_AUDIT_ACTIONS[targetStatus], entityType: "Review" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const reviews = await prisma.review.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true },
      });

      const eligibleIds: string[] = [];
      const skipped: { id: string; reason: string }[] = [];
      const metadataById: Record<string, Record<string, unknown>> = {};

      for (const review of reviews) {
        const transition = resolveReviewStatusTransition(review.status, targetStatus);
        if (!transition.ok) {
          skipped.push({ id: review.id, reason: transition.error });
          continue;
        }
        if (!transition.audit) {
          skipped.push({
            id: review.id,
            reason: `Already ${REVIEW_STATUS_META[targetStatus].label.toLowerCase()}.`,
          });
          continue;
        }
        eligibleIds.push(review.id);
        metadataById[review.id] = transition.audit.metadata;
      }

      for (const id of ids) {
        if (!reviews.some((r) => r.id === id) && !skipped.some((s) => s.id === id)) {
          skipped.push({ id, reason: "Review no longer exists." });
        }
      }

      if (eligibleIds.length > 0) {
        await prisma.review.updateMany({
          where: { id: { in: eligibleIds } },
          data: { status: targetStatus },
        });
      }

      revalidateReviews(eligibleIds);

      return { affectedIds: eligibleIds, skipped, metadataById };
    }
  );
}

export async function bulkApproveReviews(ids: string[]) {
  return bulkChangeReviewStatus(ids, "APPROVED");
}

export async function bulkRejectReviews(ids: string[]) {
  return bulkChangeReviewStatus(ids, "REJECTED");
}

export async function bulkMarkReviewsAsSpam(ids: string[]) {
  return bulkChangeReviewStatus(ids, "SPAM");
}

export async function bulkResetReviewsToPending(ids: string[]) {
  return bulkChangeReviewStatus(ids, "PENDING");
}
