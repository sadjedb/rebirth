"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import type { CouponFormState } from "@/app/admin/coupons/components/coupon-form-state";
import type { CouponFormAction } from "@/app/admin/coupons/components/useCouponForm";

export function CouponRulesCard({
  state,
  dispatch,
  errors,
  disabled = false,
}: {
  state: CouponFormState;
  dispatch: Dispatch<CouponFormAction>;
  errors: Partial<Record<string, string>>;
  disabled?: boolean;
}) {
  return (
    <FormCard title="Rules">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Minimum order value"
          htmlFor="minOrderValue"
          error={errors.minOrderValue}
          hint="Leave blank for no minimum."
        >
          <input
            id="minOrderValue"
            type="number"
            min={0}
            step={1}
            value={state.minOrderValue}
            disabled={disabled}
            onChange={(e) => dispatch({ type: "SET", field: "minOrderValue", value: e.target.value })}
            className={`${inputClass(Boolean(errors.minOrderValue))} disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </Field>

        <Field
          label="Usage limit"
          htmlFor="usageLimit"
          error={errors.usageLimit}
          hint="Total redemptions across all customers. Leave blank for unlimited."
        >
          <input
            id="usageLimit"
            type="number"
            min={1}
            step={1}
            value={state.usageLimit}
            disabled={disabled}
            onChange={(e) => dispatch({ type: "SET", field: "usageLimit", value: e.target.value })}
            className={`${inputClass(Boolean(errors.usageLimit))} disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Starts" htmlFor="startsAt" error={errors.startsAt} hint="Leave blank to start immediately.">
          <input
            id="startsAt"
            type="datetime-local"
            value={state.startsAt}
            disabled={disabled}
            onChange={(e) => dispatch({ type: "SET", field: "startsAt", value: e.target.value })}
            className={`${inputClass(Boolean(errors.startsAt))} disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </Field>

        <Field label="Ends" htmlFor="endsAt" error={errors.endsAt} hint="Leave blank to never expire.">
          <input
            id="endsAt"
            type="datetime-local"
            value={state.endsAt}
            disabled={disabled}
            onChange={(e) => dispatch({ type: "SET", field: "endsAt", value: e.target.value })}
            className={`${inputClass(Boolean(errors.endsAt))} disabled:opacity-60 disabled:cursor-not-allowed`}
          />
        </Field>
      </div>
    </FormCard>
  );
}
