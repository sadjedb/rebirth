"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import { brand } from "@/config/brand";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function SeoCard({
  state,
  dispatch,
  errors,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <FormCard title="SEO">
      <div>
        <p className="text-xs font-medium text-admin-fg mb-1.5">URL</p>
        <p className="text-sm text-admin-muted truncate">
          {brand.domain}/product/{state.slug || "…"}
        </p>
        <p className="text-xs text-admin-muted mt-1">Edit the slug in General information.</p>
      </div>

      <Field
        label="Meta title"
        htmlFor="metaTitle"
        error={errors.metaTitle}
        hint={`Falls back to the product name if left blank.`}
      >
        <input
          id="metaTitle"
          value={state.metaTitle}
          onChange={(e) => dispatch({ type: "SET", field: "metaTitle", value: e.target.value })}
          className={inputClass(Boolean(errors.metaTitle))}
        />
      </Field>

      <Field
        label="Meta description"
        htmlFor="metaDescription"
        error={errors.metaDescription}
        hint="Falls back to the short description if left blank."
      >
        <textarea
          id="metaDescription"
          rows={3}
          value={state.metaDescription}
          onChange={(e) => dispatch({ type: "SET", field: "metaDescription", value: e.target.value })}
          className={`${inputClass(Boolean(errors.metaDescription))} resize-none`}
        />
      </Field>
    </FormCard>
  );
}
