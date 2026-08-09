"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAuditedMutation } from "@/lib/audit";
import { checkPermission } from "@/lib/admin/auth";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import { couponFormSchema } from "@/app/admin/coupons/validators";
import { canTransitionCouponStatus } from "@/lib/coupons/status";
import { assertNotStale, ConcurrencyError } from "@/lib/admin/concurrency";

export type UpdateCouponResult =
  | { success: true; id: string }
  | { success: false; fieldErrors?: Partial<Record<string, string>>; formError?: string; conflict?: boolean };

export async function updateCoupon(
  id: string,
  updatedAt: string,
  raw: unknown
): Promise<UpdateCouponResult> {
  const authError = await checkPermission("coupons:edit");
  if (authError) return authError;

  const parsed = couponFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }
  const values = parsed.data;

  const existing = await prisma.coupon.findUnique({
    where: { id },
    select: { id: true, status: true, updatedAt: true },
  });
  if (!existing) {
    return { success: false, formError: "This coupon no longer exists." };
  }

  try {
    assertNotStale(updatedAt, existing.updatedAt);
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        success: false,
        conflict: true,
        formError:
          "This coupon was changed by someone else while you were editing. Reload the page to see the latest version before saving again.",
      };
    }
    throw error;
  }

  // Status is fully permissive (DRAFT <-> ACTIVE <-> ARCHIVED, see
  // lib/coupons/status.ts) — this rejection branch isn't reachable today
  // since every status can reach every other one, but it stays for the
  // same reason Products keeps its own equivalent check: a future rule
  // restricting one particular flip only needs to change status.ts, not
  // every call site.
  if (!canTransitionCouponStatus(existing.status, values.status)) {
    return {
      success: false,
      formError: `Can't change status from ${existing.status} to ${values.status}.`,
    };
  }

  const codeTaken = await prisma.coupon.findFirst({
    where: { code: values.code, id: { not: id } },
    select: { id: true },
  });
  if (codeTaken) {
    return { success: false, fieldErrors: { code: "This coupon code is already in use." } };
  }

  return withAuditedMutation(
    "coupons:edit",
    { action: "coupon.update", entityType: "Coupon" },
    async () => {
      // usageCount is deliberately absent from this `data` object —
      // couponFormSchema doesn't even carry it, so there's no value to
      // accidentally forward here. Existing redemption history
      // (Order.couponId rows) and past orders' discountTotal/total are
      // never touched by this action — only the Coupon row itself.
      const coupon = await prisma.coupon.update({
        where: { id },
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
      revalidatePath(`/admin/coupons/${id}`);

      return {
        result: { success: true as const, id: coupon.id },
        entityId: coupon.id,
        metadata: { code: coupon.code, status: coupon.status, previousStatus: existing.status },
      };
    }
  );
}
