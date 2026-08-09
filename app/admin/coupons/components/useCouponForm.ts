"use client";

import { useReducer } from "react";
import type { CouponFormState } from "@/app/admin/coupons/components/coupon-form-state";

/** Just SET — unlike Products, Coupon has no derived-field logic (no
 *  slug-from-name equivalent, no media/ref arrays), so the extra action
 *  types useProductForm.ts needs don't apply here. */
export type CouponFormAction = {
  type: "SET";
  field: keyof CouponFormState;
  value: CouponFormState[keyof CouponFormState];
};

function reducer(state: CouponFormState, action: CouponFormAction): CouponFormState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export function useCouponForm(initial: CouponFormState) {
  return useReducer(reducer, initial);
}
