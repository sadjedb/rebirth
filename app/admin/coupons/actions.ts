"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/admin/auth";
import { withAuditedMutation } from "@/lib/audit";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import { couponFormSchema } from "@/app/admin/coupons/validators";

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
