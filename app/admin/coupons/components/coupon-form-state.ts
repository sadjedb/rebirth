import type { Coupon, CouponDiscountType, CouponStatus } from "@prisma/client";

/** String-based form state, same reasoning as
 *  app/admin/products/components/product-form-state.ts: <input> values
 *  are strings, Zod's z.coerce handles numeric/date conversion at submit
 *  time. The DB/query layer deals in real types (number, Date). */
export type CouponFormState = {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  /** "" means "not set" (no minimum) — never coerced to "0", which is a
   *  meaningfully different value (a real $0 minimum). */
  minOrderValue: string;
  /** "" means "not set" (unlimited). */
  usageLimit: string;
  /** "" means "not set" (no start/end restriction). datetime-local
   *  input value format ("YYYY-MM-DDTHH:mm"). */
  startsAt: string;
  endsAt: string;
  status: CouponStatus;
  /** "" in create mode — populated only when editing, used as the
   *  staleness token (see lib/admin/concurrency.ts). */
  updatedAt: string;
};

export const emptyCouponForm: CouponFormState = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  status: "DRAFT",
  updatedAt: "",
};

/** Local time, no timezone conversion — matches what a <input
 *  type="datetime-local"> element both accepts and produces. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function couponToFormState(coupon: Coupon): CouponFormState {
  return {
    code: coupon.code,
    description: coupon.description ?? "",
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minOrderValue: coupon.minOrderValue === null ? "" : String(coupon.minOrderValue),
    usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
    startsAt: coupon.startsAt ? toDatetimeLocalValue(coupon.startsAt) : "",
    endsAt: coupon.endsAt ? toDatetimeLocalValue(coupon.endsAt) : "",
    status: coupon.status,
    updatedAt: coupon.updatedAt.toISOString(),
  };
}
