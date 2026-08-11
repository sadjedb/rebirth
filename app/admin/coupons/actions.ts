"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/admin/auth";
import { withAuditedMutation } from "@/lib/audit";
import { withAuditedBulkMutation, type BulkMutationOutcome } from "@/lib/admin/bulk-actions";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import { couponFormSchema } from "@/app/admin/coupons/validators";
import { canTransitionCouponStatus, COUPON_STATUS_META } from "@/lib/coupons/status";
import type { CouponStatus } from "@prisma/client";

export type CreateCouponResult =
  | { success: true; id: string }
  | { success: false; fieldErrors?: Partial<Record<string, string>>; formError?: string };

export async function createCoupon(raw: unknown): Promise<CreateCouponResult> {
  const authError = await checkPermission("coupons:create");
  if (authError) return authError;

  const parsed = couponFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }
  const values = parsed.data;

  // Uniqueness check happens before entering the audited mutation — a
  // validation failure isn't a mutation worth auditing (same convention
  // as createProduct's slug/sku checks).
  const codeTaken = await prisma.coupon.findUnique({
    where: { code: values.code },
    select: { id: true },
  });
  if (codeTaken) {
    return { success: false, fieldErrors: { code: "This coupon code is already in use." } };
  }

  return withAuditedMutation(
    "coupons:create",
    { action: "coupon.create", entityType: "Coupon" },
    async () => {
      // usageCount is not in couponFormSchema at all — structurally
      // impossible for this action to accept a client-supplied value for
      // it; the schema default (0) is always what gets written.
      const coupon = await prisma.coupon.create({
        data: {
          code: values.code,
          description: values.description || null,
          discountType: values.discountType,
          discountValue: values.discountValue,
          minOrderValue: values.minOrderValue ?? null,
          usageLimit: values.usageLimit ?? null,
          startsAt: values.startsAt ?? null,
          endsAt: values.endsAt ?? null,
          status: values.status,
        },
      });

      revalidatePath("/admin/coupons");

      return {
        result: { success: true as const, id: coupon.id },
        entityId: coupon.id,
        metadata: { code: coupon.code, status: coupon.status },
      };
    }
  );
}

// =============================================================================
// Bulk status actions (Phase 5). Every affected row still goes through
// the shared canTransitionCouponStatus (lib/coupons/status.ts) — never
// duplicated or re-derived here — so a future rule restricting one
// particular flip only needs to change status.ts, not this file. The
// approved lifecycle is currently fully permissive (every status legal
// from every other), so no selection is actually rejected by the
// transition check today; a same-status "transition" (already ACTIVE,
// targeted at ACTIVE) is still skipped as a no-op — nothing changed,
// nothing worth an audit entry or an Order.couponId-adjacent write.
// =============================================================================

const BULK_STATUS_AUDIT_ACTIONS: Record<CouponStatus, string> = {
  DRAFT: "coupon.bulk_status_draft",
  ACTIVE: "coupon.bulk_status_active",
  ARCHIVED: "coupon.bulk_status_archived",
};

/**
 * Shared by the three bulk actions below — mirrors
 * bulkChangeReviewStatus's shape in app/admin/reviews/actions.ts: fresh
 * findMany of current status right before deciding eligibility (the bulk
 * concurrency safeguard, same one Orders/Reviews' bulk actions rely on),
 * partition eligible/skipped via the shared transition helper, one
 * batched updateMany restricted to `status` only, then
 * withAuditedBulkMutation writes coupon.bulk_status_<target> with
 * per-row {from, to} metadata — useful here because, unlike Orders'
 * single-origin bulk transitions, Coupon's fully-permissive lifecycle
 * means a single bulk action (e.g. "Archive") can legally pull eligible
 * rows from either DRAFT or ACTIVE, so `from` genuinely varies row to
 * row within one call, same reasoning Reviews' bulk actions already
 * established for lib/admin/bulk-actions.ts's metadataById field.
 *
 * Never touches usageCount, Order.couponId, Order.discountTotal,
 * Order.total, or OrderItem.discount — the updateMany's `data` is
 * `{ status }` only.
 */
async function bulkSetCouponStatus(ids: string[], targetStatus: CouponStatus) {
  return withAuditedBulkMutation(
    "coupons:edit",
    { action: BULK_STATUS_AUDIT_ACTIONS[targetStatus], entityType: "Coupon" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const coupons = await prisma.coupon.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true },
      });

      const eligibleIds: string[] = [];
      const skipped: { id: string; reason: string }[] = [];
      const metadataById: Record<string, Record<string, unknown>> = {};

      for (const coupon of coupons) {
        if (coupon.status === targetStatus) {
          skipped.push({
            id: coupon.id,
            reason: `Already ${COUPON_STATUS_META[targetStatus].label.toLowerCase()}.`,
          });
          continue;
        }
        if (!canTransitionCouponStatus(coupon.status, targetStatus)) {
          skipped.push({
            id: coupon.id,
            reason: `Can't change status from ${coupon.status} to ${targetStatus}.`,
          });
          continue;
        }
        eligibleIds.push(coupon.id);
        metadataById[coupon.id] = { from: coupon.status, to: targetStatus };
      }

      for (const id of ids) {
        if (!coupons.some((c) => c.id === id) && !skipped.some((s) => s.id === id)) {
          skipped.push({ id, reason: "Coupon no longer exists." });
        }
      }

      if (eligibleIds.length > 0) {
        await prisma.coupon.updateMany({
          where: { id: { in: eligibleIds } },
          data: { status: targetStatus },
        });
      }

      revalidatePath("/admin/coupons");
      for (const id of eligibleIds) {
        revalidatePath(`/admin/coupons/${id}`);
      }

      return { affectedIds: eligibleIds, skipped, metadataById };
    }
  );
}

export async function bulkSetCouponsDraft(ids: string[]) {
  return bulkSetCouponStatus(ids, "DRAFT");
}

export async function bulkSetCouponsActive(ids: string[]) {
  return bulkSetCouponStatus(ids, "ACTIVE");
}

export async function bulkSetCouponsArchived(ids: string[]) {
  return bulkSetCouponStatus(ids, "ARCHIVED");
}
