import type { ReviewStatus } from "@prisma/client";

/**
 * Display metadata for the List/Detail views' status column/badge/filter
 * (Phase 2/3), plus the moderation transition rules (Phase 4) — mirrors
 * lib/orders/status.ts holding both concerns together in one file.
 */

export const REVIEW_STATUSES: readonly ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED", "SPAM"];

export const REVIEW_STATUS_META: Record<ReviewStatus, { label: string }> = {
  PENDING: { label: "Pending" },
  APPROVED: { label: "Approved" },
  REJECTED: { label: "Rejected" },
  SPAM: { label: "Spam" },
};

export const REVIEW_STATUS_BADGE_VARIANT: Record<
  ReviewStatus,
  "neutral" | "success" | "danger" | "warning"
> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "danger",
  SPAM: "warning",
};

// =============================================================================
// Status transitions (Phase 4). Single mechanism every Review status
// mutation goes through (app/admin/reviews/[id]/actions.ts) — mirrors
// resolveTransition in lib/orders/status.ts, simplified to one dimension
// (Review has only `status`, not three independent fields like Order) and
// no timestamp side effect (no equivalent of completedAt/cancelledAt is
// part of the approved architecture for Reviews).
// =============================================================================

type ReviewTransitionRule = {
  /** Statuses this value may be legally reached FROM. Approved lifecycle:
   *  corrections from REJECTED/SPAM must pass back through PENDING rather
   *  than jumping directly between each other or straight to APPROVED. */
  from: readonly ReviewStatus[];
};

const REVIEW_STATUS_TRANSITIONS: Record<ReviewStatus, ReviewTransitionRule> = {
  PENDING: { from: ["REJECTED", "SPAM"] },
  APPROVED: { from: ["PENDING"] },
  REJECTED: { from: ["PENDING", "APPROVED"] },
  SPAM: { from: ["PENDING", "APPROVED"] },
};

const REVIEW_TRANSITION_AUDIT_ACTIONS: Record<ReviewStatus, string> = {
  PENDING: "review.reset_to_pending",
  APPROVED: "review.approve",
  REJECTED: "review.reject",
  SPAM: "review.spam",
};

export type ReviewTransitionResult =
  | {
      ok: true;
      /** Null for a same-value no-op transition — nothing changed, so
       *  nothing to audit. */
      audit: { action: string; metadata: { from: ReviewStatus; to: ReviewStatus } } | null;
    }
  | { ok: false; error: string };

export function resolveReviewStatusTransition(
  from: ReviewStatus,
  to: ReviewStatus
): ReviewTransitionResult {
  if (from === to) return { ok: true, audit: null };

  const rule = REVIEW_STATUS_TRANSITIONS[to];
  if (!rule.from.includes(from)) {
    return { ok: false, error: `Can't change review status from ${from} to ${to}.` };
  }

  return {
    ok: true,
    audit: { action: REVIEW_TRANSITION_AUDIT_ACTIONS[to], metadata: { from, to } },
  };
}

/**
 * All statuses legally reachable from `from`, plus `from` itself. Mirrors
 * getAllowedOrderStatusTransitions — derived from the same transition
 * table above, no separate allow-list to fall out of sync with it.
 */
export function getAllowedReviewStatusTransitions(from: ReviewStatus): readonly ReviewStatus[] {
  return REVIEW_STATUSES.filter(
    (status) => status === from || REVIEW_STATUS_TRANSITIONS[status].from.includes(from)
  );
}
