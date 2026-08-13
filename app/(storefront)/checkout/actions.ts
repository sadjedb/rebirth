"use server";

import { checkoutSchema, createOrder, CouponRedemptionError, OutOfStockError } from "@/lib/orders/storefront";
import { validateCoupon } from "@/lib/coupons/redemption";
import { getSession } from "@/lib/session";
import type { CartItem } from "@/lib/cart-context";

export type SubmitOrderResult =
  | { success: true; orderId: string }
  | { success: false; fieldErrors: Partial<Record<string, string>>; formError?: string };

export type ApplyCouponResult =
  | { valid: true; discountAmount: number }
  | { valid: false; error: string };

/**
 * Preview only — read-only (lib/coupons/redemption.ts's validateCoupon),
 * no usageCount increment. Lets the checkout UI show the discount before
 * the order is actually placed. The amount shown here is NOT trusted at
 * submission time: submitOrder passes the raw code through to createOrder,
 * which recomputes and atomically redeems inside its own transaction —
 * this preview could be stale by the time the real order writes (someone
 * else exhausts the usage limit in between), and createOrder's own check
 * is what actually matters.
 */
export async function applyCoupon(code: string, subtotal: number): Promise<ApplyCouponResult> {
  const result = await validateCoupon(code, subtotal);
  if (!result.valid) return { valid: false, error: result.error };
  return { valid: true, discountAmount: result.discountAmount };
}

export async function submitOrder(
  rawInput: Record<string, string>,
  items: CartItem[]
): Promise<SubmitOrderResult> {
  const parsed = checkoutSchema.safeParse(rawInput);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  if (items.length === 0) {
    return {
      success: false,
      fieldErrors: {},
      formError: "Your bag is empty — add something before checking out.",
    };
  }

  // Basic quantity sanity check — guards against a corrupted localStorage cart.
  const hasInvalidQuantity = items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1);
  if (hasInvalidQuantity) {
    return {
      success: false,
      fieldErrors: {},
      formError: "There was a problem with your bag. Please refresh and try again.",
    };
  }

  const session = await getSession();
  try {
    const order = await createOrder(parsed.data, items, session?.id);
    return { success: true, orderId: order.id };
  } catch (error) {
    if (error instanceof CouponRedemptionError) {
      return { success: false, fieldErrors: {}, formError: error.message };
    }
    if (error instanceof OutOfStockError) {
      return { success: false, fieldErrors: {}, formError: error.message };
    }
    throw error;
  }
}
