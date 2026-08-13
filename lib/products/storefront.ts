import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, Category } from "@prisma/client";

export type { Category };
/** Every storefront query includes media (ordered by position) and
 *  active variants (ordered for display) — the type reflects that so
 *  components can rely on product.media/product.variants always
 *  existing. Only isActive variants: an inactive one is deliberately
 *  invisible to the storefront (Module 6 Phase 1 architecture — removed
 *  from new purchasing, history preserved) even though it still exists
 *  in the database. */
export type Product = Prisma.ProductGetPayload<{
  include: { media: true; variants: true };
}>;

/**
 * Every query in this file is customer-facing and enforces the same two
 * filters — status ACTIVE, not soft-deleted — so a draft or archived
 * product structurally cannot appear on the storefront. This is exactly
 * why storefront queries live in a separate file from admin queries
 * (lib/products/admin.ts) rather than one shared module: the invariant is
 * enforced by which file you import from, not by remembering a `where`
 * clause at every call site.
 */
const STOREFRONT_WHERE = { status: "ACTIVE" as const, deletedAt: null };
const ACTIVE_VARIANTS_INCLUDE = {
  variants: { where: { isActive: true }, orderBy: { position: "asc" as const } },
};

/** Returns published products, optionally filtered by category slug. */
export async function getProducts(categorySlug?: string): Promise<Product[]> {
  return prisma.product.findMany({
    where: {
      ...STOREFRONT_WHERE,
      category: categorySlug ? { slug: categorySlug } : undefined,
    },
    orderBy: { createdAt: "asc" },
    include: { media: { orderBy: { position: "asc" } }, ...ACTIVE_VARIANTS_INCLUDE },
  });
}

/** Returns a single published product by slug, or null if not found/not published. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findFirst({
    where: { slug, ...STOREFRONT_WHERE },
    include: { media: { orderBy: { position: "asc" } }, ...ACTIVE_VARIANTS_INCLUDE },
  });
}

/** Returns up to `limit` published products in the same category, excluding the given slug. */
export async function getRelatedProducts(
  categoryId: string | null,
  excludeSlug: string,
  limit = 3
): Promise<Product[]> {
  if (!categoryId) return [];
  return prisma.product.findMany({
    where: { ...STOREFRONT_WHERE, categoryId, slug: { not: excludeSlug } },
    take: limit,
    include: { media: { orderBy: { position: "asc" } }, ...ACTIVE_VARIANTS_INCLUDE },
  });
}

/** Live categories for the collection page filter — no longer a hardcoded enum. */
export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}
