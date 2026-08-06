import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Prisma } from "@prisma/client";

export type AdminCustomerFilters = {
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. "name" is a compound sort
 *  (firstName then lastName, see orderBy below) — unlike Orders' Customer
 *  column, this one genuinely is sortable, per the approved Module 3
 *  architecture. `orderCount`/`totalSpent`/`lastOrderAt` are NOT here:
 *  they're aggregates computed below, not columns on User, so there's no
 *  single-query way to sort by them without scanning every order in the
 *  system — out of scope for this phase (see the architecture review). */
const SORTABLE_COLUMNS = ["name", "email", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

export type AdminCustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
};

export async function getAdminCustomers(filters: AdminCustomerFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "createdAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";
  const search = filters.search?.trim();

  const where: Prisma.UserWhereInput = {
    // Fixed scope, not a UI-toggleable filter — Module 3 is specifically
    // about registered (role=CUSTOMER) customers. Staff accounts live in
    // the separate, not-yet-built Users & Roles module (see nav.ts).
    role: "CUSTOMER",
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    sortColumn === "name" ? [{ firstName: sortDir }, { lastName: sortDir }] : [{ [sortColumn]: sortDir }];

  const [users, total]: [
    { id: string; firstName: string; lastName: string; email: string; createdAt: Date }[],
    number,
  ] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  const userIds = users.map((u: { id: string }) => u.id);

  /**
   * One aggregate query, scoped to only this page's users via `in` — not
   * one query per row (no N+1), and never a scan of every order in the
   * system. CANCELLED orders are excluded from all three metrics: a
   * cancelled order was never actually fulfilled or paid for, so it
   * shouldn't inflate order count, total spent, or "last order" recency
   * any more than an order that was never placed would.
   */
  const orderStats: {
    userId: string | null;
    _count: { _all: number };
    _sum: { total: number | null };
    _max: { createdAt: Date | null };
  }[] =
    userIds.length > 0
      ? await prisma.order.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds }, status: { not: "CANCELLED" } },
          _count: { _all: true },
          _sum: { total: true },
          _max: { createdAt: true },
        })
      : [];

  const statsByUserId = new Map(
    orderStats
      .filter((stat) => stat.userId !== null)
      .map((stat) => [
        stat.userId as string,
        {
          orderCount: stat._count._all,
          totalSpent: stat._sum.total ?? 0,
          lastOrderAt: stat._max.createdAt,
        },
      ])
  );

  const items: AdminCustomerListItem[] = users.map((user) => {
    const stats = statsByUserId.get(user.id);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      orderCount: stats?.orderCount ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      lastOrderAt: stats?.lastOrderAt ?? null,
    };
  });

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page,
    pageSize,
  };
}
