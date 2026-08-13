import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Prisma } from "@prisma/client";

export type InventoryActiveFilter = "active" | "inactive";
export type InventoryTrackingFilter = "tracked" | "untracked";
export type InventoryStockFilter = "low" | "out";

export type AdminInventoryFilters = {
  search?: string;
  color?: string;
  size?: string;
  active?: InventoryActiveFilter;
  tracking?: InventoryTrackingFilter;
  stock?: InventoryStockFilter;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. "product" isn't here: it's joined
 *  from Product, not a direct ProductVariant column, same "don't fake-sort
 *  a joined field" rule Reviews' reviewer/product columns already follow.
 *  `stock`/`sku`/`createdAt`/`updatedAt` are real ProductVariant columns,
 *  so they're genuinely sortable. */
const SORTABLE_COLUMNS = ["stock", "sku", "createdAt", "updatedAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

export type AdminInventoryListItem = {
  id: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  lowStockThreshold: number | null;
  trackInventory: boolean;
  continueSellingOutOfStock: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; name: string; slug: string };
  isLowStock: boolean;
};

/** A variant is low stock when tracking is on, a threshold is set, and
 *  stock has fallen to or below it — matches the approved Module 6
 *  Phase 1 architecture's definition exactly (§ Low Stock Alerts).
 *  Untracked variants and variants with no threshold are never flagged —
 *  there's nothing meaningful to compare against. This is a pure,
 *  in-memory derivation, not a persisted flag or a database filter, so it
 *  stays correct without any extra write path (see note on the `stock`
 *  filter below for why "out" IS pushed into the query instead). */
function computeIsLowStock(variant: {
  trackInventory: boolean;
  stock: number;
  lowStockThreshold: number | null;
}): boolean {
  return variant.trackInventory && variant.lowStockThreshold !== null && variant.stock <= variant.lowStockThreshold;
}

export async function getAdminInventory(filters: AdminInventoryFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "updatedAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";
  const search = filters.search?.trim();

  const where: Prisma.ProductVariantWhereInput = {
    ...(filters.color ? { color: { equals: filters.color, mode: "insensitive" } } : {}),
    ...(filters.size ? { size: { equals: filters.size, mode: "insensitive" } } : {}),
    ...(filters.active === "active" ? { isActive: true } : {}),
    ...(filters.active === "inactive" ? { isActive: false } : {}),
    ...(filters.tracking === "tracked" ? { trackInventory: true } : {}),
    ...(filters.tracking === "untracked" ? { trackInventory: false } : {}),
    // "out" is a real, unambiguous query condition (stock <= 0), so it's
    // pushed into the WHERE clause like any other filter. "low" is NOT
    // handled here — see the note below getAdminInventory.
    ...(filters.stock === "out" ? { stock: { lte: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { color: { contains: search, mode: "insensitive" } },
            { size: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy: { [sortColumn]: sortDir },
      // "low" stock filtering can't be expressed as a single WHERE
      // condition — the threshold to compare against lives on the same
      // row (lowStockThreshold), and Prisma has no "compare column to
      // column" operator without a raw query, which this project doesn't
      // use anywhere (see Module 6 architecture notes). Rather than
      // introduce raw SQL for one filter, "low" is applied in memory
      // after the page is fetched — this is only safe/cheap because the
      // page size is small and bounded (DEFAULT_PAGE_SIZE), never the
      // full table. See the post-filter below.
      skip: filters.stock === "low" ? 0 : (page - 1) * pageSize,
      take: filters.stock === "low" ? undefined : pageSize,
      select: {
        id: true,
        color: true,
        size: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        trackInventory: true,
        continueSellingOutOfStock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.productVariant.count({ where }),
  ]);

  let items: AdminInventoryListItem[] = rows.map((row) => ({
    ...row,
    isLowStock: computeIsLowStock(row),
  }));

  let effectiveTotal = total;

  if (filters.stock === "low") {
    // See the comment above the query: "low" couldn't be pushed into
    // Prisma's WHERE, so it's applied here instead, then paginated
    // in-memory. Acceptable at this project's scale (see Module 6
    // architecture notes on avoiding raw SQL for one filter) — this is
    // the one path where `take` was left unset above specifically so
    // this filter sees every matching row before paginating.
    const filtered = items.filter((item) => item.isLowStock);
    effectiveTotal = filtered.length;
    items = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  }

  return {
    items,
    total: effectiveTotal,
    pageCount: Math.max(Math.ceil(effectiveTotal / pageSize), 1),
    page,
    pageSize,
  };
}

/** Distinct, non-null color/size values currently in use — powers the
 *  color/size filter dropdowns without hardcoding a value list (there is
 *  no controlled vocabulary for either, per the approved architecture —
 *  both are plain free-text columns, same as Product.sizes always was). */
export async function getInventoryFilterOptions() {
  const [colors, sizes] = await Promise.all([
    prisma.productVariant.findMany({
      where: { color: { not: null } },
      distinct: ["color"],
      select: { color: true },
      orderBy: { color: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { size: { not: null } },
      distinct: ["size"],
      select: { size: true },
      orderBy: { size: "asc" },
    }),
  ]);

  return {
    colors: colors.map((c) => c.color as string),
    sizes: sizes.map((s) => s.size as string),
  };
}

/**
 * Module 6 (Inventory), Phase 3. Powers /admin/inventory/[productId] —
 * a product's full variant list (for manual adjustment) plus its recent
 * movement history. Distinct from Phase 7's Timeline: this is a plain,
 * un-styled recent-activity list scoped to Phase 3's own needs (seeing
 * what an adjustment just did), not the polished per-variant/per-product
 * timeline UI Phase 7 will build.
 */
export async function getProductInventoryDetail(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true },
  });
  if (!product) return null;

  const [variants, movements] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        color: true,
        size: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        trackInventory: true,
        continueSellingOutOfStock: true,
        isActive: true,
      },
    }),
    prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        variantId: true,
        quantityDelta: true,
        resultingStock: true,
        reason: true,
        note: true,
        orderId: true,
        actorEmail: true,
        createdAt: true,
      },
    }),
  ]);

  return { product, variants, movements };
}

export type ProductInventoryDetail = NonNullable<Awaited<ReturnType<typeof getProductInventoryDetail>>>;
