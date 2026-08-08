import type { ReviewStatus } from "@prisma/client";

/**
 * Display metadata only, for the Review List's status column/filter
 * (Phase 2). Transition rules (resolveReviewStatusTransition,
 * getAllowedReviewStatusTransitions, following the exact shape of
 * lib/orders/status.ts / lib/products/status.ts) are Phase 4 —
 * Moderation — scope, not implemented here. See the Module 4
 * architecture notes for the approved transition table:
 *
 *   PENDING:  { from: ["REJECTED", "SPAM"] }
 *   APPROVED: { from: ["PENDING"] }
 *   REJECTED: { from: ["PENDING", "APPROVED"] }
 *   SPAM:     { from: ["PENDING", "APPROVED"] }
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
