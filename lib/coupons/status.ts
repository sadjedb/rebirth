import type { CouponStatus } from "@prisma/client";

export const COUPON_STATUSES: readonly CouponStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export const COUPON_STATUS_META: Record<CouponStatus, { label: string; description: string }> = {
  DRAFT: { label: "Draft", description: "Not usable at checkout yet." },
  ACTIVE: { label: "Active", description: "Usable at checkout (subject to its dates/limit)." },
  ARCHIVED: { label: "Archived", description: "Retired — no longer usable. Kept for order history." },
};

export const COUPON_STATUS_BADGE_VARIANT: Record<
  CouponStatus,
  "neutral" | "success" | "danger" | "warning"
> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  ARCHIVED: "danger",
};

/**
 * Every status can reach every other status — fully permissive, mirroring
 * lib/products/status.ts exactly. A coupon's status is an editorial
 * decision an admin can always correct (unlike Orders' physical,
 * one-directional process); there's no business reason to restrict any
 * particular flip. Archiving is the only "delete" this module has (see
 * the Coupon model's doc comment) and DRAFT/ACTIVE/ARCHIVED are all
 * reachable from each other for that reason too — a mistakenly-archived
 * coupon must be just as correctable as any other status change.
 */
const ALLOWED_TRANSITIONS: Record<CouponStatus, readonly CouponStatus[]> = {
  DRAFT: COUPON_STATUSES,
  ACTIVE: COUPON_STATUSES,
  ARCHIVED: COUPON_STATUSES,
};

/** `from: null` means creating a new coupon — any status is a valid starting point. */
export function getAllowedCouponStatusTransitions(from: CouponStatus | null): readonly CouponStatus[] {
  return from ? ALLOWED_TRANSITIONS[from] : COUPON_STATUSES;
}

export function canTransitionCouponStatus(from: CouponStatus | null, to: CouponStatus): boolean {
  return getAllowedCouponStatusTransitions(from).includes(to);
}

/**
 * Derived, not persisted — `status` (editorial lifecycle) and temporal
 * validity (startsAt/endsAt) are independent, per the Module 5
 * architecture. An ACTIVE coupon past its endsAt is still `status:
 * ACTIVE` in the database; nothing auto-transitions it (no background
 * job). This is purely a display-time computation for the admin list/
 * detail — "what would actually happen if a customer tried this code
 * right now".
 */
export type CouponEffectiveState = "DRAFT" | "SCHEDULED" | "ACTIVE" | "EXPIRED" | "ARCHIVED";

export const COUPON_EFFECTIVE_STATE_META: Record<CouponEffectiveState, { label: string }> = {
  DRAFT: { label: "Draft" },
  SCHEDULED: { label: "Scheduled" },
  ACTIVE: { label: "Active" },
  EXPIRED: { label: "Expired" },
  ARCHIVED: { label: "Archived" },
};

export const COUPON_EFFECTIVE_STATE_BADGE_VARIANT: Record<
  CouponEffectiveState,
  "neutral" | "success" | "danger" | "warning"
> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  ACTIVE: "success",
  EXPIRED: "danger",
  ARCHIVED: "danger",
};

export function getCouponEffectiveState(
  coupon: { status: CouponStatus; startsAt: Date | null; endsAt: Date | null },
  now: Date = new Date()
): CouponEffectiveState {
  if (coupon.status === "ARCHIVED") return "ARCHIVED";
  if (coupon.status === "DRAFT") return "DRAFT";
  // status === "ACTIVE" from here — check temporal validity.
  if (coupon.startsAt && coupon.startsAt > now) return "SCHEDULED";
  if (coupon.endsAt && coupon.endsAt < now) return "EXPIRED";
  return "ACTIVE";
}
