"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import { ListInput } from "@/components/admin/ui/ListInput";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function InventoryCard({
  state,
  dispatch,
  errors,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <FormCard title="Inventory">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="SKU" htmlFor="sku" error={errors.sku} hint="Must be unique if set.">
          <input
            id="sku"
            value={state.sku}
            onChange={(e) => dispatch({ type: "SET", field: "sku", value: e.target.value })}
            className={inputClass(Boolean(errors.sku))}
          />
        </Field>

        <Field label="Stock" htmlFor="stock" error={errors.stock}>
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            value={state.stock}
            onChange={(e) => dispatch({ type: "SET", field: "stock", value: e.target.value })}
            className={inputClass(Boolean(errors.stock))}
          />
        </Field>
      </div>

      <Field
        label="Low stock threshold"
        htmlFor="lowStockThreshold"
        error={errors.lowStockThreshold}
        hint="Flags the product as low stock in the admin once stock falls to or below this."
      >
        <input
          id="lowStockThreshold"
          type="number"
          min={0}
          step={1}
          value={state.lowStockThreshold}
          onChange={(e) => dispatch({ type: "SET", field: "lowStockThreshold", value: e.target.value })}
          className={inputClass(Boolean(errors.lowStockThreshold))}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-admin-fg cursor-pointer">
        <input
          type="checkbox"
          checked={state.trackInventory}
          onChange={(e) => dispatch({ type: "SET", field: "trackInventory", value: e.target.checked })}
          className="h-4 w-4 accent-admin-accent"
        />
        Track inventory for this product
      </label>

      <label className="flex items-center gap-2 text-sm text-admin-fg cursor-pointer">
        <input
          type="checkbox"
          checked={state.continueSellingOutOfStock}
          onChange={(e) =>
            dispatch({ type: "SET", field: "continueSellingOutOfStock", value: e.target.checked })
          }
          className="h-4 w-4 accent-admin-accent"
        />
        Continue selling when out of stock
      </label>

      <Field label="Sizes" hint="Sizes this product is offered in.">
        <ListInput
          values={state.sizes}
          onChange={(value) => dispatch({ type: "SET_SIZES", value })}
          placeholder="e.g. M"
        />
      </Field>
    </FormCard>
  );
}
