"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { withAuditedMutation } from "@/lib/audit";
import { checkPermission } from "@/lib/admin/auth";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import { productFormSchema, getPublishErrors } from "@/app/admin/products/validators";
import {
  resolveCategoryRef,
  resolveCollectionRefs,
  resolveTagRefs,
} from "@/lib/products/admin";
import { canTransitionTo } from "@/lib/products/status";
import { assertNotStale, ConcurrencyError } from "@/lib/admin/concurrency";
import { deleteMedia } from "@/lib/media";

export type UpdateProductResult =
  | { success: true; id: string; slug: string }
  | { success: false; fieldErrors?: Partial<Record<string, string>>; formError?: string; conflict?: boolean };

export async function updateProduct(
  id: string,
  updatedAt: string,
  raw: unknown
): Promise<UpdateProductResult> {
  const authError = await checkPermission("products:edit");
  if (authError) return authError;

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }
  const values = parsed.data;

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true, updatedAt: true },
  });
  if (!existing) {
    return { success: false, formError: "This product no longer exists." };
  }

  try {
    assertNotStale(updatedAt, existing.updatedAt);
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        success: false,
        conflict: true,
        formError:
          "This product was changed by someone else while you were editing. Reload the page to see the latest version before saving again.",
      };
    }
    throw error;
  }

  if (!canTransitionTo(existing.status, values.status)) {
    return {
      success: false,
      formError: `Can't change status from ${existing.status} to ${values.status}.`,
    };
  }

  if (values.status === "ACTIVE") {
    const publishErrors = getPublishErrors(values);
    if (publishErrors.length > 0) {
      return { success: false, formError: publishErrors.join(" ") };
    }
  }

  const [slugTaken, skuTaken] = await Promise.all([
    prisma.product.findFirst({
      where: { slug: values.slug, id: { not: id } },
      select: { id: true },
    }),
    values.sku
      ? prisma.product.findFirst({
          where: { sku: values.sku, id: { not: id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (slugTaken) {
    return { success: false, fieldErrors: { slug: "This URL slug is already in use." } };
  }
  if (skuTaken) {
    return { success: false, fieldErrors: { sku: "This SKU is already in use." } };
  }

  return withAuditedMutation(
    "products:edit",
    { action: "product.update", entityType: "Product" },
    async () => {
      const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const categoryId = await resolveCategoryRef(tx, values.category);
        const collectionIds = await resolveCollectionRefs(tx, values.collections);
        const tagIds = await resolveTagRefs(tx, values.tags);

        // Media reconciliation: rows the admin removed during editing were
        // already deleted immediately (both Cloudinary and the DB row —
        // see removeProductMedia), so this delete is a defensive safety
        // net for anything that slipped through, not the primary path.
        const survivingDbIds = values.media.map((m) => m.dbId).filter((v): v is string => Boolean(v));
        await tx.productMedia.deleteMany({
          where: {
            productId: id,
            id: { notIn: survivingDbIds.length > 0 ? survivingDbIds : ["__none__"] },
          },
        });

        for (const [index, item] of values.media.entries()) {
          if (item.dbId) {
            await tx.productMedia.update({
              where: { id: item.dbId },
              data: { position: index, altText: item.altText },
            });
          } else {
            await tx.productMedia.create({
              data: {
                productId: id,
                type: item.type,
                url: item.url,
                thumbnailUrl: item.thumbnailUrl,
                providerId: item.providerId,
                altText: item.altText,
                position: index,
              },
            });
          }
        }

        return tx.product.update({
          where: { id },
          data: {
            name: values.name,
            slug: values.slug,
            code: values.code,
            shortDescription: values.shortDescription || null,
            description: values.description ?? "",
            details: values.details,
            status: values.status,
            price: values.price,
            compareAtPrice: values.compareAtPrice ?? null,
            costPrice: values.costPrice ?? null,
            sku: values.sku || null,
            stock: values.stock,
            lowStockThreshold: values.lowStockThreshold ?? null,
            trackInventory: values.trackInventory,
            continueSellingOutOfStock: values.continueSellingOutOfStock,
            sizes: values.sizes,
            categoryId,
            collections: { set: collectionIds.map((cid) => ({ id: cid })) },
            tags: { set: tagIds.map((tid) => ({ id: tid })) },
            metaTitle: values.metaTitle || null,
            metaDescription: values.metaDescription || null,
            // Only stamp publishedAt the first time a product goes ACTIVE —
            // re-saving an already-published product shouldn't reset it.
            publishedAt:
              values.status === "ACTIVE" && existing.status !== "ACTIVE" ? new Date() : undefined,
          },
        });
      });

      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/collection");
      revalidatePath("/");
      revalidatePath(`/product/${product.slug}`);

      return {
        result: { success: true as const, id: product.id, slug: product.slug },
        entityId: product.id,
        metadata: { name: product.name, status: product.status, previousStatus: existing.status },
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Delete / Restore / Permanently delete

export type SimpleActionResult = { success: true } | { success: false; error: string };

/** Soft delete — sets deletedAt. The product disappears from every normal
 *  admin/storefront query but its row (and order history referencing it)
 *  stays intact. Reversible via restoreProduct. */
export async function deleteProduct(id: string): Promise<SimpleActionResult> {
  const authError = await checkPermission("products:delete");
  if (authError) return authError;

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) return { success: false, error: "This product no longer exists." };

  return withAuditedMutation(
    "products:delete",
    { action: "product.delete", entityType: "Product" },
    async () => {
      await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");
      return { result: { success: true as const }, entityId: id, metadata: { name: existing.name } };
    }
  );
}

/** Fully recovers a soft-deleted product — clears deletedAt, nothing else
 *  about the record changes (status/price/etc. are exactly as they were). */
export async function restoreProduct(id: string): Promise<SimpleActionResult> {
  const authError = await checkPermission("products:restore");
  if (authError) return authError;

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true, name: true },
  });
  if (!existing) return { success: false, error: "This product isn't in the trash." };

  return withAuditedMutation(
    "products:restore",
    { action: "product.restore", entityType: "Product" },
    async () => {
      await prisma.product.update({ where: { id }, data: { deletedAt: null } });
      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");
      return { result: { success: true as const }, entityId: id, metadata: { name: existing.name } };
    }
  );
}

/** Irreversible. Restricted to SUPER_ADMIN via the products:permanently_delete
 *  capability — hard deletes should be rare and intentional, never a bulk
 *  everyday action. Only allowed on already-trashed products, as one more
 *  speed bump against deleting something live by mistake. */
export async function permanentlyDeleteProduct(id: string): Promise<SimpleActionResult> {
  const authError = await checkPermission("products:permanently_delete");
  if (authError) return authError;

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true, name: true },
  });
  if (!existing) {
    return { success: false, error: "Only trashed products can be permanently deleted." };
  }

  // Module 4 (Reviews): Review.productId is a required relation with no
  // SetNull — a review's entire subject is the product it's about, so
  // this is checked before the delete rather than letting the database's
  // RESTRICT constraint surface as a raw error.
  const reviewCount = await prisma.review.count({ where: { productId: id } });
  if (reviewCount > 0) {
    return {
      success: false,
      error: `This product has ${reviewCount} review${reviewCount === 1 ? "" : "s"} and can't be permanently deleted.`,
    };
  }

  return withAuditedMutation(
    "products:permanently_delete",
    { action: "product.permanently_delete", entityType: "Product" },
    async () => {
      // OrderItem snapshots (name/price/etc.) at time of purchase and only
      // references productId for a "view current product" link — deleting
      // the product leaves historical orders intact, just without that
      // link. Media rows cascade-delete at the DB level; the actual
      // Cloudinary assets are cleaned up best-effort, not blocking.
      const media = await prisma.productMedia.findMany({
        where: { productId: id },
        select: { providerId: true, type: true },
      });
      await prisma.product.delete({ where: { id } });

      await Promise.all(
        media.map((m: { providerId: string; type: string }) =>
          deleteMedia(m.providerId, m.type === "VIDEO" ? "video" : "image").catch(() => {})
        )
      );

      revalidatePath("/admin/products");
      return { result: { success: true as const }, entityId: id, metadata: { name: existing.name } };
    }
  );
}
