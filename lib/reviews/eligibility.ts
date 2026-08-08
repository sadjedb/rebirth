import "server-only";
import { prisma } from "@/lib/prisma";

export type EligibleReviewItem = {
  /** OrderItem id — what the submission action actually keys off. */
  orderItemId: string;
  productId: string;
  /** Snapshotted at purchase time, same fields OrderItem already keeps
   *  for its own display purposes — survives a later product edit and
   *  (for name/slug) even a permanent product deletion, though the
   *  latter can no longer happen once a Review exists for the product
   *  (see permanentlyDeleteProduct's precondition check). */
  name: string;
  slug: string;
  quantity: number;
  purchasedAt: Date;
};

/**
 * Every completed-order line item this user hasn't already reviewed.
 * Not deduplicated to one row per product: a customer could have bought
 * the same product in two separate completed orders, and while the
 * (userId, productId) database constraint means they can still only
 * submit one review for it, which specific purchase they're reviewing
 * stays visible to them rather than silently collapsed. No pagination —
 * bounded by one customer's own completed-order history.
 */
export async function getEligibleOrderItemsForReview(userId: string): Promise<EligibleReviewItem[]> {
  const rows = await prisma.orderItem.findMany({
    where: {
      order: { userId, status: "COMPLETED" },
      // Reverse-relation filter — Review.orderItemId isn't unique, so
      // this is a `none` check on the array relation, not `review: null`.
      reviews: { none: {} },
    },
    select: {
      id: true,
      productId: true,
      name: true,
      slug: true,
      quantity: true,
      order: { select: { createdAt: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  // productId is nullable on OrderItem (SetNull on product deletion) —
  // an eligible-to-review row needs a live product to review, so a
  // permanently-deleted product's order lines are simply not reviewable.
  return rows
    .filter((row): row is typeof row & { productId: string } => row.productId !== null)
    .map((row) => ({
      orderItemId: row.id,
      productId: row.productId,
      name: row.name,
      slug: row.slug,
      quantity: row.quantity,
      purchasedAt: row.order.createdAt,
    }));
}

/**
 * Has this user already reviewed this product? Used as a fast-path UX
 * check before submission — NOT the authoritative duplicate guard. The
 * @@unique([userId, productId]) database constraint is what actually
 * protects against a race between two concurrent submissions; this is
 * only here to give the account-page UI an accurate "already reviewed"
 * state without a second round trip.
 */
export async function hasReviewedProduct(userId: string, productId: string): Promise<boolean> {
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return existing !== null;
}
