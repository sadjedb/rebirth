import type { ProductStatus } from "@prisma/client";

export const PRODUCT_STATUSES: readonly ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; description: string }> = {
  DRAFT: { label: "Draft", description: "Hidden from the storefront." },
  ACTIVE: { label: "Active", description: "Live on the storefront." },
  ARCHIVED: { label: "Archived", description: "Hidden, kept for records." },
};

export const PRODUCT_STATUS_BADGE_VARIANT: Record<ProductStatus, "success" | "neutral" | "warning"> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  ARCHIVED: "warning",
};

/**
 * Allowed transitions FROM each status. Every status can currently reach
 * every other status (including itself, so "save without changing
 * status" is always valid) — there's no business reason yet to restrict
 * any particular flip.
 *
 * The value of this module isn't today's permissiveness — it's that a
 * future rule ("can't un-archive without a manager", "drafts can't skip
 * straight to archived") gets implemented ONCE here, and Create, Edit,
 * and Bulk Actions all pick it up automatically instead of three separate
 * implementations quietly drifting apart.
 */
const ALLOWED_TRANSITIONS: Record<ProductStatus, readonly ProductStatus[]> = {
  DRAFT: PRODUCT_STATUSES,
  ACTIVE: PRODUCT_STATUSES,
  ARCHIVED: PRODUCT_STATUSES,
};

/** `from: null` means creating a new product — any status is a valid starting point. */
export function getAllowedTransitions(from: ProductStatus | null): readonly ProductStatus[] {
  return from ? ALLOWED_TRANSITIONS[from] : PRODUCT_STATUSES;
}

export function canTransitionTo(from: ProductStatus | null, to: ProductStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}

/**
 * Additional field requirements enforced only when transitioning TO a
 * given status — today only ACTIVE has any (the "publish" requirements).
 * Called the same way regardless of target status, so a future
 * requirement on e.g. ARCHIVED slots in without changing any call site.
 */
export function getStatusRequirements(
  to: ProductStatus,
  values: { category: unknown; media: { altText?: string }[]; price: number }
): string[] {
  if (to !== "ACTIVE") return [];

  const errors: string[] = [];
  if (!values.category) errors.push("Select a category before publishing.");
  if (values.media.length === 0) {
    errors.push("Add at least one photo or video before publishing.");
  } else if (values.media.every((m) => !m.altText?.trim())) {
    errors.push("At least one media item needs alt text before publishing.");
  }
  if (values.price <= 0) errors.push("Set a price greater than $0 before publishing.");
  return errors;
}
