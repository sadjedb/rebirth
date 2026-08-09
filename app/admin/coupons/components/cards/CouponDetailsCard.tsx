"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import type { CouponFormState } from "@/app/admin/coupons/components/coupon-form-state";
import type { CouponFormAction } from "@/app/admin/coupons/components/useCouponForm";

export function CouponDetailsCard({
  state,
  dispatch,
  errors,
}: {
  state: CouponFormState;
  dispatch: Dispatch<CouponFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <FormCard title="Coupon details">
      <Field label="Code" htmlFor="code" required error={errors.code} hint="Customers enter this at checkout — not case-sensitive.">
        <input
          id="code"
          type="text"
          value={state.code}
          onChange={(e) =>
            dispatch({ type: "SET", field: "code", value: e.target.value.toUpperCase() })
          }
          className={`${inputClass(Boolean(errors.code))} font-mono`}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description} hint="Staff-facing only — never shown to the customer.">
        <input
          id="description"
          type="text"
          value={state.description}
          onChange={(e) => dispatch({ type: "SET", field: "description", value: e.target.value })}
          className={inputClass(Boolean(errors.description))}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Discount type" htmlFor="discountType" required>
          <select
            id="discountType"
            value={state.discountType}
            onChange={(e) =>
              dispatch({ type: "SET", field: "discountType", value: e.target.value as CouponFormState["discountType"] })
            }
            className={inputClass(false)}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
        </Field>

        <Field
          label={state.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount ($)"}
          htmlFor="discountValue"
          required
          error={errors.discountValue}
          hint={state.discountType === "PERCENTAGE" ? "1–100" : "Capped at the order subtotal automatically."}
        >
          <input
            id="discountValue"
            type="number"
            min={state.discountType === "PERCENTAGE" ? 1 : 1}
            max={state.discountType === "PERCENTAGE" ? 100 : undefined}
            step={1}
            value={state.discountValue}
            onChange={(e) => dispatch({ type: "SET", field: "discountValue", value: e.target.value })}
            className={inputClass(Boolean(errors.discountValue))}
          />
        </Field>
      </div>
    </FormCard>
  );
}
