import type { AdminProductDetail } from "@/lib/products/admin";
import type { ProductFormState } from "@/app/admin/products/types";

/**
 * Converts a loaded product (with category/collections/tags/media
 * relations) into the form's string-based state shape. Always sets
 * `slugManuallyEdited: true` — an existing product's slug is a live URL;
 * editing the name must never silently change it, unlike a brand-new
 * product where auto-sync from the name is exactly what you want.
 */
export function productToFormState(product: AdminProductDetail): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    slugManuallyEdited: true,
    code: product.code,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    details: product.details,
    status: product.status,
    updatedAt: product.updatedAt.toISOString(),

    price: String(product.price),
    compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : "",
    costPrice: product.costPrice != null ? String(product.costPrice) : "",

    category: product.category ? { kind: "existing", id: product.category.id } : null,
    collections: product.collections.map((c: { id: string }) => ({ kind: "existing" as const, id: c.id })),
    tags: product.tags.map((t: { id: string }) => ({ kind: "existing" as const, id: t.id })),

    media: product.media.map((m: AdminProductDetail["media"][number]) => ({
      id: m.id,
      dbId: m.id,
      url: m.url,
      providerId: m.providerId,
      type: m.type,
      thumbnailUrl: m.thumbnailUrl ?? undefined,
      altText: m.altText ?? "",
      position: m.position,
    })),

    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
  };
}
