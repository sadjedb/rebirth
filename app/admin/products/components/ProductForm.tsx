"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import {
  useProductForm,
  emptyProductForm,
} from "@/app/admin/products/components/useProductForm";
import { createProduct } from "@/app/admin/products/actions";
import { updateProduct } from "@/app/admin/products/[id]/actions";
import { GeneralCard } from "@/app/admin/products/components/cards/GeneralCard";
import { MediaCard } from "@/app/admin/products/components/cards/MediaCard";
import { PricingCard } from "@/app/admin/products/components/cards/PricingCard";
import { InventoryCard } from "@/app/admin/products/components/cards/InventoryCard";
import { OrganizationCard } from "@/app/admin/products/components/cards/OrganizationCard";
import { SeoCard } from "@/app/admin/products/components/cards/SeoCard";
import { PublishingCard } from "@/app/admin/products/components/cards/PublishingCard";
import type { OrganizationOption, ProductFormState } from "@/app/admin/products/types";
import type { ProductStatus } from "@prisma/client";

type ProductFormProps = {
  categories: OrganizationOption[];
  collections: OrganizationOption[];
  tags: OrganizationOption[];
} & (
  | { mode: "create" }
  | { mode: "edit"; productId: string; initialFormState: ProductFormState }
);

export function ProductForm(props: ProductFormProps) {
  const { categories, collections, tags, mode } = props;
  const router = useRouter();
  const toast = useToast();

  const baseline = mode === "edit" ? props.initialFormState : emptyProductForm;
  const currentStatus: ProductStatus | null = mode === "edit" ? props.initialFormState.status : null;

  const [state, dispatch] = useProductForm(baseline);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Edit's dirty check compares against the loaded product, not an empty
  // form — everything else about "is this different from where we
  // started" is identical between the two modes.
  const isDirty = JSON.stringify(state) !== JSON.stringify(baseline);

  // Browser-level protection (tab close/refresh). In-app navigation via the
  // sidebar or browser back isn't intercepted — Next.js App Router doesn't
  // expose a navigation-blocking primitive without extra tooling, and that
  // gap is disproportionate scope to close here. The explicit Cancel
  // control below is the primary intentional-discard path and IS guarded.
  useEffect(() => {
    if (!isDirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleCancel() {
    if (isDirty) {
      setConfirmingDiscard(true);
    } else {
      router.push("/admin/products");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setConflict(false);

    const payload = {
      name: state.name,
      slug: state.slug,
      code: state.code,
      shortDescription: state.shortDescription,
      description: state.description,
      details: state.details,
      status: state.status,
      price: state.price,
      compareAtPrice: state.compareAtPrice,
      costPrice: state.costPrice,
      category: state.category,
      collections: state.collections,
      tags: state.tags,
      media: state.media.map((m) => ({
        url: m.url,
        providerId: m.providerId,
        type: m.type,
        thumbnailUrl: m.thumbnailUrl,
        altText: m.altText,
        position: m.position,
        dbId: m.dbId,
      })),
      metaTitle: state.metaTitle,
      metaDescription: state.metaDescription,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(payload)
          : await updateProduct(props.productId, state.updatedAt, payload);

      if (result.success) {
        toast({
          variant: "success",
          title:
            mode === "edit"
              ? "Product updated"
              : state.status === "ACTIVE"
              ? "Product published"
              : "Draft saved",
        });
        router.push("/admin/products");
        return;
      }

      if (result.fieldErrors) setErrors(result.fieldErrors);
      if (result.formError) setFormError(result.formError);
      if ("conflict" in result && result.conflict) setConflict(true);
      toast({ variant: "error", title: "Couldn't save product", description: result.formError });
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GeneralCard state={state} dispatch={dispatch} errors={errors} />
          <MediaCard state={state} dispatch={dispatch} errors={errors} />
          <PricingCard state={state} dispatch={dispatch} errors={errors} />
          <InventoryCard productId={mode === "edit" ? props.productId : undefined} />
          <SeoCard state={state} dispatch={dispatch} errors={errors} />
        </div>

        <div className="space-y-6">
          <PublishingCard state={state} dispatch={dispatch} currentStatus={currentStatus} />
          <OrganizationCard
            state={state}
            dispatch={dispatch}
            errors={errors}
            categories={categories}
            collections={collections}
            tags={tags}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 border-t border-admin-border bg-admin-bg/95 backdrop-blur-sm flex items-center justify-between">
        <div>
          {formError && (
            <p role="alert" className="text-sm text-admin-danger">
              {formError}
              {conflict && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-2 underline hover:no-underline"
                >
                  Reload page
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-md border border-admin-border text-admin-fg hover:bg-admin-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving…" : state.status === "ACTIVE" ? "Publish" : "Save"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDiscard}
        title="Discard unsaved changes?"
        description="Your changes haven't been saved. This can't be undone."
        confirmLabel="Discard"
        variant="danger"
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => {
          setConfirmingDiscard(false);
          router.push("/admin/products");
        }}
      />
    </form>
  );
}
