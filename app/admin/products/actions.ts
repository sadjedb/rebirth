"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma, ProductStatus } from "@prisma/client";
import { withAnyPermission, checkPermission } from "@/lib/admin/auth";
import { withAuditedMutation } from "@/lib/audit";
import { withAuditedBulkMutation, type BulkMutationOutcome } from "@/lib/admin/bulk-actions";
import { canTransitionTo, getStatusRequirements } from "@/lib/products/status";
import { uploadMedia, deleteMedia, type UploadedMedia } from "@/lib/media";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import {
  productFormSchema,
  getPublishErrors,
} from "@/app/admin/products/validators";
import {
  resolveCategoryRef,
  resolveCollectionRefs,
  resolveTagRefs,
} from "@/lib/products/admin";

export type CreateProductResult =
  | { success: true; id: string; slug: string }
  | { success: false; fieldErrors?: Partial<Record<string, string>>; formError?: string };

export async function createProduct(raw: unknown): Promise<CreateProductResult> {
  const authError = await checkPermission("products:create");
  if (authError) return authError;

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }
  const values = parsed.data;

  if (values.status === "ACTIVE") {
    const publishErrors = getPublishErrors(values);
    if (publishErrors.length > 0) {
      return { success: false, formError: publishErrors.join(" ") };
    }
  }

  // Uniqueness check happens before entering the audited mutation — a
  // validation failure isn't a mutation worth auditing. (SKU uniqueness
  // moved to ProductVariant in Module 6 Phase 3 — Product no longer has
  // its own sku field to check.)
  const slugTaken = await prisma.product.findUnique({
    where: { slug: values.slug },
    select: { id: true },
  });
  if (slugTaken) {
    return { success: false, fieldErrors: { slug: "This URL slug is already in use." } };
  }

  return withAuditedMutation(
    "products:create",
    { action: "product.create", entityType: "Product" },
    async () => {
      const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Resolving refs and creating the product happen in the same
        // transaction — if the product create fails, any category/
        // collection/tag just created for it rolls back too, rather than
        // leaving orphan rows behind.
        const categoryId = await resolveCategoryRef(tx, values.category);
        const collectionIds = await resolveCollectionRefs(tx, values.collections);
        const tagIds = await resolveTagRefs(tx, values.tags);

        return tx.product.create({
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
            categoryId,
            collections: { connect: collectionIds.map((id) => ({ id })) },
            tags: { connect: tagIds.map((id) => ({ id })) },
            metaTitle: values.metaTitle || null,
            metaDescription: values.metaDescription || null,
            publishedAt: values.status === "ACTIVE" ? new Date() : null,
            media: {
              create: values.media.map((m, index) => ({
                type: m.type,
                url: m.url,
                thumbnailUrl: m.thumbnailUrl,
                providerId: m.providerId,
                altText: m.altText,
                position: index,
              })),
            },
            // Module 6 (Inventory), Phase 3. A brand-new product needs at
            // least one variant to be purchasable at all — without this,
            // AddToBag would have nothing to resolve and the product
            // would be permanently "Sold out". This is the exact same
            // default/legacy variant shape the Phase 3 migration gave
            // every pre-existing product; real color/size variants (and
            // their real stock) are added afterward from the Inventory
            // section, same as the legacy migration's default variants
            // are meant to be split.
            variants: {
              create: [
                {
                  color: null,
                  size: null,
                  variantKey: "-::-",
                  stock: 0,
                  trackInventory: true,
                  continueSellingOutOfStock: false,
                  isActive: true,
                },
              ],
            },
          },
        });
      });

      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");
      if (product.status === "ACTIVE") revalidatePath(`/product/${product.slug}`);

      return {
        result: { success: true as const, id: product.id, slug: product.slug },
        entityId: product.id,
        metadata: { name: product.name, status: product.status },
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Media upload/removal — used by MediaCard as the admin drags/drops files,
// independent of the final product save (matches how Shopify's editor
// works: media uploads immediately, the URL becomes part of form state,
// the actual product row is written on Save).

export type UploadMediaResult =
  | { success: true; media: UploadedMedia }
  | { success: false; error: string };

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];

export async function uploadProductMedia(formData: FormData): Promise<UploadMediaResult> {
  return withAnyPermission(["products:create", "products:edit"], async () => {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false as const, error: "No file provided." };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false as const, error: "Unsupported file type." };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false as const, error: "File is too large (15MB max)." };
    }

    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadMedia(buffer, { resourceType });
    return { success: true as const, media: uploaded };
  });
}

export async function removeProductMedia(
  providerId: string,
  type: "IMAGE" | "VIDEO",
  mediaDbId?: string
): Promise<{ success: boolean; error?: string }> {
  return withAnyPermission(["products:create", "products:edit"], async () => {
    await deleteMedia(providerId, type === "VIDEO" ? "video" : "image");
    if (mediaDbId) {
      // Best-effort — if the row's already gone (e.g. a retry), this
      // shouldn't fail the whole remove action.
      await prisma.productMedia.deleteMany({ where: { id: mediaDbId } });
    }
    return { success: true };
  });
}

// ---------------------------------------------------------------------------
// Bulk actions. Every one reuses the exact capabilities and eligibility
// rules its single-item counterpart already uses (canTransitionTo,
// getStatusRequirements) — a product eligible to be individually
// published is exactly a product eligible to be bulk-published, and that
// rule lives in exactly one place either way.

/** Bulk Publish / Bulk Archive — same underlying action, different target status. */
export async function bulkUpdateProductStatus(ids: string[], targetStatus: ProductStatus) {
  return withAuditedBulkMutation(
    "products:edit",
    { action: `product.bulk_status_${targetStatus.toLowerCase()}`, entityType: "Product" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const products = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: {
          id: true,
          status: true,
          price: true,
          categoryId: true,
          media: { select: { altText: true } },
        },
      });

      const eligibleIds: string[] = [];
      const newlyActiveIds: string[] = [];
      const skipped: { id: string; reason: string }[] = [];

      for (const product of products) {
        if (!canTransitionTo(product.status, targetStatus)) {
          skipped.push({ id: product.id, reason: `Can't change status from ${product.status} to ${targetStatus}.` });
          continue;
        }
        const requirementErrors = getStatusRequirements(targetStatus, {
          category: product.categoryId,
          media: product.media,
          price: product.price,
        });
        if (requirementErrors.length > 0) {
          skipped.push({ id: product.id, reason: requirementErrors[0] });
          continue;
        }
        eligibleIds.push(product.id);
        if (targetStatus === "ACTIVE" && product.status !== "ACTIVE") {
          newlyActiveIds.push(product.id);
        }
      }

      for (const id of ids) {
        if (
          !products.some((p: { id: string }) => p.id === id) &&
          !skipped.some((s) => s.id === id)
        ) {
          skipped.push({ id, reason: "Product no longer exists." });
        }
      }

      if (eligibleIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: eligibleIds } },
          data: { status: targetStatus },
        });
      }
      // publishedAt only stamped the first time a product goes ACTIVE — a
      // second targeted updateMany rather than a per-row loop, still just
      // two batched queries total regardless of selection size.
      if (newlyActiveIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: newlyActiveIds } },
          data: { publishedAt: new Date() },
        });
      }

      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");

      return { affectedIds: eligibleIds, skipped };
    }
  );
}

export async function bulkDeleteProducts(ids: string[]) {
  return withAuditedBulkMutation(
    "products:delete",
    { action: "product.bulk_delete", entityType: "Product" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const eligible = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true },
      });
      const eligibleIds = eligible.map((p: { id: string }) => p.id);

      if (eligibleIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: eligibleIds } },
          data: { deletedAt: new Date() },
        });
      }

      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");

      const skipped = ids
        .filter((id) => !eligibleIds.includes(id))
        .map((id) => ({ id, reason: "Already deleted or no longer exists." }));

      return { affectedIds: eligibleIds, skipped };
    }
  );
}

export async function bulkRestoreProducts(ids: string[]) {
  return withAuditedBulkMutation(
    "products:restore",
    { action: "product.bulk_restore", entityType: "Product" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const eligible = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        select: { id: true },
      });
      const eligibleIds = eligible.map((p: { id: string }) => p.id);

      if (eligibleIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: eligibleIds } },
          data: { deletedAt: null },
        });
      }

      revalidatePath("/admin/products");
      revalidatePath("/collection");
      revalidatePath("/");

      const skipped = ids
        .filter((id) => !eligibleIds.includes(id))
        .map((id) => ({ id, reason: "Not in the trash." }));

      return { affectedIds: eligibleIds, skipped };
    }
  );
}

export async function bulkPermanentlyDeleteProducts(ids: string[]) {
  return withAuditedBulkMutation(
    "products:permanently_delete",
    { action: "product.bulk_permanently_delete", entityType: "Product" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const eligible = await prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        select: { id: true, media: { select: { providerId: true, type: true } } },
      });

      // Module 6 (Inventory), Phase 3 — same precondition
      // permanentlyDeleteProduct enforces for a single record: a product
      // with any StockMovement history (via variants' cascade) must not
      // be hard-deleted, or that history silently disappears along with
      // it. Checked via the denormalized productId on StockMovement, no
      // join needed.
      const movementCounts = await prisma.stockMovement.groupBy({
        by: ["productId"],
        where: { productId: { in: eligible.map((p) => p.id) } },
        _count: { _all: true },
      });
      const productIdsWithHistory = new Set(movementCounts.map((m) => m.productId));

      const eligibleIds = eligible
        .filter((p) => !productIdsWithHistory.has(p.id))
        .map((p: { id: string }) => p.id);

      if (eligibleIds.length > 0) {
        // Cascades ProductMedia at the DB level; OrderItem.productId is
        // nullable with ON DELETE SET NULL (see Phase 6) so historical
        // orders referencing these products are untouched.
        await prisma.product.deleteMany({ where: { id: { in: eligibleIds } } });
      }

      const eligibleIdSet = new Set(eligibleIds);
      const allMedia = eligible
        .filter((p) => eligibleIdSet.has(p.id))
        .flatMap((p: { media: { providerId: string; type: string }[] }) => p.media);
      await Promise.all(
        allMedia.map((m: { providerId: string; type: string }) =>
          deleteMedia(m.providerId, m.type === "VIDEO" ? "video" : "image").catch(() => {})
        )
      );

      revalidatePath("/admin/products");

      const skipped = ids
        .filter((id) => !eligibleIds.includes(id))
        .map((id) => ({
          id,
          reason: productIdsWithHistory.has(id)
            ? "Has inventory movement history and can't be permanently deleted."
            : "Only trashed products can be permanently deleted.",
        }));

      return { affectedIds: eligibleIds, skipped };
    }
  );
}
