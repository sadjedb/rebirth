import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Prisma, ReviewStatus } from "@prisma/client";

export type AdminReviewFilters = {
  search?: string;
  status?: ReviewStatus;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. `rating` and `createdAt` are the
 *  only sortable columns exposed on the list (Phase 2) — reviewer/product
 *  name aren't direct Review columns, same "don't fake-sort an aggregate
 *  or joined field" rule already applied to Customers' orderCount/
 *  totalSpent. */
const SORTABLE_COLUMNS = ["rating", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

export type AdminReviewListItem = {
  id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt: Date;
  reviewer: { id: string; firstName: string; lastName: string; email: string };
  // Not nullable: Review.productId is a required relation (RESTRICT, not
  // SetNull like OrderItem's) — a product can't be permanently deleted
  // while it still has reviews, see permanentlyDeleteProduct.
  product: { id: string; name: string; slug: string };
};

export async function getAdminReviews(filters: AdminReviewFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "createdAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";
  const search = filters.search?.trim();

  const where: Prisma.ReviewWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(search
      ? {
          OR: [
            { body: { contains: search, mode: "insensitive" } },
            { user: { firstName: { contains: search, mode: "insensitive" } } },
            { user: { lastName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { product: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { [sortColumn]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        body: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const items: AdminReviewListItem[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt,
    reviewer: row.user,
    product: row.product,
  }));

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page,
    pageSize,
  };
}
