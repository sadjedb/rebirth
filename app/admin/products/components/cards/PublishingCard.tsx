"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { getAllowedTransitions, PRODUCT_STATUS_META } from "@/lib/products/status";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";
import type { ProductStatus } from "@prisma/client";

export function PublishingCard({
  state,
  dispatch,
  currentStatus = null,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  /** The status this product currently has in the database — null when
   *  creating a new product (any status is a valid starting point). Edit
   *  passes the loaded product's status so only its allowed transitions
   *  are selectable. */
  currentStatus?: ProductStatus | null;
}) {
  const selectableStatuses = getAllowedTransitions(currentStatus);

  return (
    <FormCard title="Publishing">
      <fieldset className="space-y-2">
        <legend className="sr-only">Status</legend>
        {selectableStatuses.map((status) => {
          const meta = PRODUCT_STATUS_META[status];
          return (
            <label
              key={status}
              className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                state.status === status
                  ? "border-admin-accent bg-admin-accent/5"
                  : "border-admin-border hover:bg-admin-surface-hover"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={state.status === status}
                onChange={() => dispatch({ type: "SET", field: "status", value: status })}
                className="mt-0.5 accent-admin-accent"
              />
              <span>
                <span className="block text-sm text-admin-fg font-medium">{meta.label}</span>
                <span className="block text-xs text-admin-muted">{meta.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </FormCard>
  );
}
