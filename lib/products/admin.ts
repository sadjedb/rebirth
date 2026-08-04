import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Prisma, ProductStatus } from "@prisma/client";

export type AdminProductFilters = {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  /** true = only soft-deleted rows (the Trash view). Defaults to false —
   *  every other admin query hides trashed rows unless explicitly asked. */
  trashed?: boolean;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. */
const SORTABLE_COLUMNS = ["name", "price", "stock", "status", "createdAt", "updatedAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

export async function getAdminProducts(filters: AdminProductFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "createdAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";

  // Trash (deletedAt != null) is its own explicit view — every other admin
  // list query defaults to hiding soft-deleted rows.
  const where: Prisma.ProductWhereInput = {
    deletedAt: filters.trashed ? { not: null } : null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
            { code: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortColumn]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        media: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page,
    pageSize,
  };
}

/** Loads a single product for editing. Any status is fetchable except
 *  soft-deleted — a deleted product isn't editable, restoring it first
 *  (Phase 6) is the correct path back to editable. */
export async function getAdminProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      collections: true,
      tags: true,
      media: { orderBy: { position: "asc" } },
    },
  });
}

export type AdminProductDetail = NonNullable<Awaited<ReturnType<typeof getAdminProductById>>>;

export type AdminProductListItem = Awaited<ReturnType<typeof getAdminProducts>>["items"][number];

/** Options for the Organization card's Collections picker. */
export async function getCollectionOptions() {
  return prisma.collection.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Options for the Organization card's Tags picker. */
export async function getTagOptions() {
  return prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// ---------------------------------------------------------------------------
// Category/Collection/Tag resolution — used by the product create/edit
// actions to turn a mix of "existing id" and "new name" references into
// real row ids, creating new rows (upsert by slug) as needed. Always call
// these with a transaction client so a product-create failure can't leave
// orphan Category/Collection/Tag rows behind.

import { slugify } from "@/lib/slugify";
import type { OrganizationRef } from "@/app/admin/products/validators";

type Tx = Prisma.TransactionClient;

export async function resolveCategoryRef(
  tx: Tx,
  ref: OrganizationRef | null
): Promise<string | null> {
  if (!ref) return null;
  if (ref.kind === "existing") return ref.id;

  const slug = slugify(ref.name);
  const category = await tx.category.upsert({
    where: { slug },
    update: {},
    create: { name: ref.name, slug },
  });
  return category.id;
}

export async function resolveCollectionRefs(tx: Tx, refs: OrganizationRef[]): Promise<string[]> {
  return Promise.all(
    refs.map(async (ref) => {
      if (ref.kind === "existing") return ref.id;
      const slug = slugify(ref.name);
      const collection = await tx.collection.upsert({
        where: { slug },
        update: {},
        create: { name: ref.name, slug },
      });
      return collection.id;
    })
  );
}

export async function resolveTagRefs(tx: Tx, refs: OrganizationRef[]): Promise<string[]> {
  return Promise.all(
    refs.map(async (ref) => {
      if (ref.kind === "existing") return ref.id;
      const slug = slugify(ref.name);
      const tag = await tx.tag.upsert({
        where: { slug },
        update: {},
        create: { name: ref.name, slug },
      });
      return tag.id;
    })
  );
}
