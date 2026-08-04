"use server";

import { checkoutSchema, createOrder } from "@/lib/orders/storefront";
import { getSession } from "@/lib/session";
import type { CartItem } from "@/lib/cart-context";

export type SubmitOrderResult =
  | { success: true; orderId: string }
  | { success: false; fieldErrors: Partial<Record<string, string>>; formError?: string };

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
  const order = await createOrder(parsed.data, items, session?.id);
  return { success: true, orderId: order.id };
}
