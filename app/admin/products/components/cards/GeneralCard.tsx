"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field, inputClass } from "@/components/admin/ui/Field";
import { ListInput } from "@/components/admin/ui/ListInput";
import type { ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function GeneralCard({
  state,
  dispatch,
  errors,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <FormCard title="General information">
      <Field label="Name" htmlFor="name" required error={errors.name}>
        <input
          id="name"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", value: e.target.value })}
          className={inputClass(Boolean(errors.name))}
        />
      </Field>

      <Field
        label="URL slug"
        htmlFor="slug"
        required
        error={errors.slug}
        hint="Auto-generated from the name until you edit it directly."
      >
        <input
          id="slug"
          value={state.slug}
          onChange={(e) => dispatch({ type: "SET_SLUG", value: e.target.value })}
          className={inputClass(Boolean(errors.slug))}
        />
      </Field>

      <Field
        label="Display code"
        htmlFor="code"
        required
        error={errors.code}
        hint={'The cosmetic label shown on the storefront, e.g. "MN-014 / BLK" — distinct from SKU.'}
      >
        <input
          id="code"
          value={state.code}
          onChange={(e) => dispatch({ type: "SET", field: "code", value: e.target.value })}
          className={inputClass(Boolean(errors.code))}
        />
      </Field>

      <Field label="Short description" htmlFor="shortDescription" error={errors.shortDescription}>
        <input
          id="shortDescription"
          value={state.shortDescription}
          onChange={(e) => dispatch({ type: "SET", field: "shortDescription", value: e.target.value })}
          className={inputClass(Boolean(errors.shortDescription))}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          rows={5}
          value={state.description}
          onChange={(e) => dispatch({ type: "SET", field: "description", value: e.target.value })}
          className={`${inputClass(Boolean(errors.description))} resize-none`}
        />
      </Field>

      <Field label="Detail bullets" hint="Materials, fit, construction notes shown on the product page.">
        <ListInput
          values={state.details}
          onChange={(value) => dispatch({ type: "SET_DETAILS", value })}
          placeholder="e.g. 12oz waxed cotton canvas"
        />
      </Field>
    </FormCard>
  );
}
