import "server-only";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, PaymentStatus, FulfillmentStatus, CurrencyCode } from "@prisma/client";

/** How many of the customer's most recent orders to show — this is an
 *  embedded summary table on a profile page, not a full paginated list.
 *  For the complete history, CustomerDetail links out to the existing
 *  Orders List pre-filtered by this customer's email (Orders' search
 *  already matches email, so no new filter dimension was needed there). */
const RECENT_ORDERS_LIMIT = 10;

export type CustomerDetailOrder = {
  id: string;
  orderNumber: number;
  createdAt: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  currency: CurrencyCode;
};

export type CustomerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  /**
   * Purchasing metrics — exclude CANCELLED orders, the same rule Phase 2
   * (Customer List) already applies: a cancelled order was never
   * actually fulfilled or paid for, so it shouldn't count toward order
   * count, total/average spend, or first/last order recency.
   */
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
  /**
   * The most recent orders, for the embedded activity table — unlike the
   * stats above, this DOES include cancelled orders. The stats answer
   * "how much has this customer actually bought"; this table answers
   * "what has this customer been doing," which cancellations are part
   * of (an admin looking at a customer who keeps cancelling is exactly
   * the kind of thing this page should surface, not hide).
   */
  recentOrders: CustomerDetailOrder[];
  /** True if there are more orders than recentOrders shows — drives the
   *  "View all orders" link to the Orders List, filtered by email. */
  hasMoreOrders: boolean;
};

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const user: { id: string; firstName: string; lastName: string; email: string; createdAt: Date } | null =
    await prisma.user.findFirst({
      where: { id, role: "CUSTOMER" },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });
  if (!user) return null;

  const [recentOrders, stats]: [
    CustomerDetailOrder[],
    {
      _count: { _all: number };
      _sum: { total: number | null };
      _avg: { total: number | null };
      _min: { createdAt: Date | null };
      _max: { createdAt: Date | null };
    },
  ] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: RECENT_ORDERS_LIMIT + 1,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        currency: true,
      },
    }),
    prisma.order.aggregate({
      where: { userId: id, status: { not: "CANCELLED" } },
      _count: { _all: true },
      _sum: { total: true },
      _avg: { total: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
  ]);

  const hasMoreOrders = recentOrders.length > RECENT_ORDERS_LIMIT;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
    orderCount: stats._count._all,
    totalSpent: stats._sum.total ?? 0,
    averageOrderValue: stats._avg.total ?? 0,
    firstOrderAt: stats._min.createdAt,
    lastOrderAt: stats._max.createdAt,
    recentOrders: hasMoreOrders ? recentOrders.slice(0, RECENT_ORDERS_LIMIT) : recentOrders,
    hasMoreOrders,
  };
}
