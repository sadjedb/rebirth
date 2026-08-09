import "server-only";
import { prisma } from "@/lib/prisma";
import type { Coupon, CouponDiscountType, Prisma } from "@prisma/client";

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Whole-dollar integers throughout (see lib/money.ts — this project has
 *  not adopted cents precision). PERCENTAGE rounds to the nearest whole
 *  dollar; FIXED_AMOUNT is capped at the subtotal so a discount can never
 *  push a total negative. */
export function computeDiscountAmount(
  coupon: { discountType: CouponDiscountType; discountValue: number },
  subtotal: number
): number {
  if (coupon.discountType === "PERCENTAGE") {
    return Math.round((subtotal * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, subtotal);
}

export type CouponValidationResult =
  | { valid: true; coupon: Coupon; discountAmount: number }
  | { valid: false; error: string };

/**
 * Read-only validation against a subtotal — every rule from the Module 5
 * redemption flow except the atomic usage-limit guard (that only matters
 * at the moment of actually writing the Order, see redeemCouponInOrder
 * below; re-checking it here would still leave a race between this read
 * and the real write). Used both for the checkout "apply" preview action
 * and as the first check inside the real redemption transaction.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<CouponValidationResult> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { valid: false, error: "Enter a coupon code." };

  const coupon = await client.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) return { valid: false, error: "This coupon code isn't valid." };
  if (coupon.status !== "ACTIVE") {
    return { valid: false, error: "This coupon isn't currently active." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, error: "This coupon isn't active yet." };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { valid: false, error: "This coupon has expired." };
  }
  if (coupon.minOrderValue !== null && subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      error: `This coupon requires a minimum order of $${coupon.minOrderValue}.`,
    };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }

  return { valid: true, coupon, discountAmount: computeDiscountAmount(coupon, subtotal) };
}

export class CouponRedemptionError extends Error {}

/**
 * The authoritative redemption step — must run inside the same
 * `$transaction` as the Order it's for (see createOrder in
 * lib/orders/storefront.ts). Re-validates everything validateCoupon
 * already checked (a preview earlier in the request is not a guarantee
 * things haven't changed by the time the order actually writes), then
 * atomically guards the usage-limit increment: the conditional
 * `updateMany` WHERE clause is checked and applied as one indivisible
 * database operation, so two concurrent transactions racing for the
 * final available redemption can't both succeed — Postgres row-locks
 * during the UPDATE, the loser's WHERE no longer matches once the
 * winner commits, and `count` comes back 0 for the loser, which throws
 * and rolls back the whole transaction, including the Order being
 * created in it. Never trust a discount amount already computed
 * earlier in the request — this recomputes it fresh against the
 * current row.
 */
export async function redeemCouponInTransaction(
  tx: Prisma.TransactionClient,
  code: string,
  subtotal: number
): Promise<{ couponId: string; discountAmount: number }> {
  const result = await validateCoupon(code, subtotal, tx);
  if (!result.valid) throw new CouponRedemptionError(result.error);

  const { coupon, discountAmount } = result;

  if (coupon.usageLimit !== null) {
    const guarded = await tx.coupon.updateMany({
      where: { id: coupon.id, usageCount: { lt: coupon.usageLimit } },
      data: { usageCount: { increment: 1 } },
    });
    if (guarded.count === 0) {
      throw new CouponRedemptionError("This coupon has reached its usage limit.");
    }
  } else {
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usageCount: { increment: 1 } },
    });
  }

  return { couponId: coupon.id, discountAmount };
}
