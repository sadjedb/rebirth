import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Prisma, CouponStatus } from "@prisma/client";

export type AdminCouponFilters = {
  search?: string;
  status?: CouponStatus;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. `status` is filtered via a
 *  dropdown, not sortable — same convention as Reviews' list. */
const SORTABLE_COLUMNS = ["code", "discountValue", "usageCount", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

export async function getAdminCoupons(filters: AdminCouponFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "createdAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";
  const search = filters.search?.trim();

  const where: Prisma.CouponWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { [sortColumn]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        usageLimit: true,
        usageCount: true,
        startsAt: true,
        endsAt: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.coupon.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page,
    pageSize,
  };
}

export type AdminCouponListItem = Awaited<ReturnType<typeof getAdminCoupons>>["items"][number];

/** Single-record fetch for the edit page — same file as the list query,
 *  mirroring where getAdminProductById lives relative to Products' list
 *  query (not a separate detail.ts; Coupon's edit view is just the row
 *  itself, no joined reviewer/product/purchase context the way Reviews'
 *  detail needed a richer separate file). */
export async function getAdminCouponById(id: string) {
  return prisma.coupon.findUnique({ where: { id } });
}
