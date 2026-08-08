import "server-only";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus } from "@prisma/client";

export type ReviewDetail = {
  id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewer: { id: string; firstName: string; lastName: string; email: string };
  product: { id: string; name: string; slug: string };
  purchase: {
    orderItemId: string;
    // Snapshotted on OrderItem at purchase time — shown here rather than
    // the live Product record, since this is "what they actually bought"
    // context (matches Orders' own ItemsCard convention of displaying the
    // order-line snapshot, not the live product).
    name: string;
    size: string;
    quantity: number;
    orderId: string;
    orderNumber: number;
    completedAt: Date | null;
  };
};

/**
 * Narrow `select` only — matches lib/customers/detail.ts's convention, no
 * `include`. Only the fields the Review Detail page actually renders:
 * reviewer identity, product identity, purchase/order-item context,
 * review content, moderation status, timestamps. See the Module 4
 * architecture's "Admin Detail Query — Avoid Over-Fetching" decision.
 */
export async function getReviewDetail(id: string): Promise<ReviewDetail | null> {
  const row = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      rating: true,
      body: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
      orderItem: {
        select: {
          id: true,
          name: true,
          size: true,
          quantity: true,
          order: { select: { id: true, orderNumber: true, completedAt: true } },
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewer: row.user,
    product: row.product,
    purchase: {
      orderItemId: row.orderItem.id,
      name: row.orderItem.name,
      size: row.orderItem.size,
      quantity: row.orderItem.quantity,
      orderId: row.orderItem.order.id,
      orderNumber: row.orderItem.order.orderNumber,
      completedAt: row.orderItem.order.completedAt,
    },
  };
}
