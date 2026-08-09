import type { CouponStatus } from "@prisma/client";

export const COUPON_STATUSES: readonly CouponStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export const COUPON_STATUS_META: Record<CouponStatus, { label: string }> = {
  DRAFT: { label: "Draft" },
  ACTIVE: { label: "Active" },
  ARCHIVED: { label: "Archived" },
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
