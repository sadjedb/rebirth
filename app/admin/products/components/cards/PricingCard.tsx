"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import { computeMargin, computeMarginPercent, formatMoney } from "@/lib/money";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function PricingCard({
  state,
  dispatch,
  errors,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  const price = Number(state.price) || 0;
  const costPrice = state.costPrice === "" ? null : Number(state.costPrice);
  const margin = computeMargin(price, costPrice);
  const marginPercent = computeMarginPercent(price, costPrice);

  return (
    <FormCard title="Pricing">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Price" htmlFor="price" required error={errors.price}>
          <input
            id="price"
            type="number"
            min={0}
            step={1}
            value={state.price}
            onChange={(e) => dispatch({ type: "SET", field: "price", value: e.target.value })}
            className={inputClass(Boolean(errors.price))}
          />
        </Field>

        <Field
          label="Compare-at price"
          htmlFor="compareAtPrice"
          error={errors.compareAtPrice}
          hint="Shown struck through, above the price, when set."
        >
          <input
            id="compareAtPrice"
            type="number"
            min={0}
            step={1}
            value={state.compareAtPrice}
            onChange={(e) => dispatch({ type: "SET", field: "compareAtPrice", value: e.target.value })}
            className={inputClass(Boolean(errors.compareAtPrice))}
          />
        </Field>
      </div>

      <Field
        label="Cost price"
        htmlFor="costPrice"
        error={errors.costPrice}
        hint="Internal only — never shown on the storefront."
      >
        <input
          id="costPrice"
          type="number"
          min={0}
          step={1}
          value={state.costPrice}
          onChange={(e) => dispatch({ type: "SET", field: "costPrice", value: e.target.value })}
          className={inputClass(Boolean(errors.costPrice))}
        />
      </Field>

      {margin !== null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-admin-surface text-sm">
          <span className="text-admin-muted">Margin</span>
          <span className="text-admin-fg font-medium">
            {formatMoney(margin)} {marginPercent !== null && `(${marginPercent}%)`}
          </span>
        </div>
      )}
    </FormCard>
  );
}
