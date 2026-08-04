"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { Field } from "@/components/admin/ui/Field";
import { ComboboxMultiSelect } from "@/components/admin/ui/ComboboxMultiSelect";
import type { OrganizationOption, ProductFormState } from "@/app/admin/products/types";
import type { ProductFormAction } from "@/app/admin/products/components/useProductForm";

export function OrganizationCard({
  state,
  dispatch,
  errors,
  categories,
  collections,
  tags,
}: {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
  errors: Partial<Record<string, string>>;
  categories: OrganizationOption[];
  collections: OrganizationOption[];
  tags: OrganizationOption[];
}) {
  return (
    <FormCard title="Organization">
      <Field
        label="Category"
        error={errors.category}
        hint="Required to publish. Type a name that doesn't exist yet to create it."
      >
        <ComboboxMultiSelect
          options={categories}
          value={state.category ? [state.category] : []}
          onChange={(next) => dispatch({ type: "SET_CATEGORY", value: next[0] ?? null })}
          multiple={false}
          placeholder="Select or create a category"
          aria-label="Category"
        />
      </Field>

      <Field label="Collections" hint="Merchandising groupings — a product can belong to several.">
        <ComboboxMultiSelect
          options={collections}
          value={state.collections}
          onChange={(value) => dispatch({ type: "SET_COLLECTIONS", value })}
          multiple
          placeholder="Select or create collections"
          aria-label="Collections"
        />
      </Field>

      <Field label="Tags">
        <ComboboxMultiSelect
          options={tags}
          value={state.tags}
          onChange={(value) => dispatch({ type: "SET_TAGS", value })}
          multiple
          placeholder="Add tags"
          aria-label="Tags"
        />
      </Field>
    </FormCard>
  );
}
