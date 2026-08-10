import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type { Coupon, OrderStatus, CurrencyCode } from "@prisma/client";

/**
 * Every redemption fact comes from the existing Order row — no
 * CouponRedemption model, per the Module 5 architecture. "Usage
 * tracking" is a query + admin UI over data that already exists, the
 * same way Reviews derived purchase eligibility from existing
 * Order/OrderItem rows instead of a new join table.
 */
export type CouponRedemption = {
  id: string;
  orderNumber: number;
  createdAt: Date;
  status: OrderStatus;
  /** Null for a guest order — Order.userId is nullable; only registered
   *  customers have a Customers detail page to link to. */
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  currency: CurrencyCode;
};

export type CouponUsageStats = {
  /** Count of Order rows referencing this coupon — a cross-check display
   *  value only. Coupon.usageCount (see CouponDetail below) remains the
   *  authoritative counter actually enforced at redemption time; this is
   *  never used to "repair" it, even if the two differ. */
  orderCount: number;
  totalDiscountGranted: number;
  mostRecentRedemptionAt: Date | null;
};

export type CouponDetail = Coupon & { usageStats: CouponUsageStats };

export async function getCouponDetail(id: string): Promise<CouponDetail | null> {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return null;

  const stats = await prisma.order.aggregate({
    where: { couponId: id },
    _count: { _all: true },
    _sum: { discountTotal: true },
    _max: { createdAt: true },
  });

  return {
    ...coupon,
    usageStats: {
      orderCount: stats._count._all,
      totalDiscountGranted: stats._sum.discountTotal ?? 0,
      mostRecentRedemptionAt: stats._max.createdAt,
    },
  };
}

const REDEMPTIONS_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export async function getCouponRedemptions(couponId: string, page: number) {
  const pageSize = REDEMPTIONS_PAGE_SIZE;
  const safePage = Math.max(page, 1);

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where: { couponId },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        subtotal: true,
        discountTotal: true,
        total: true,
        currency: true,
      },
    }),
    prisma.order.count({ where: { couponId } }),
  ]);

  const items: CouponRedemption[] = rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    createdAt: row.createdAt,
    status: row.status,
    customerId: row.userId,
    customerName: `${row.firstName} ${row.lastName}`.trim(),
    customerEmail: row.email,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    total: row.total,
    currency: row.currency,
  }));

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page: safePage,
    pageSize,
  };
}
