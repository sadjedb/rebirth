import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import type { SubmitReviewInput } from "@/lib/reviews/validators";

export type SubmitReviewResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server-side purchase re-verification + creation. Never trusts anything
 * from the client beyond the orderItemId the eligibility list already
 * showed them — userId comes from the caller's session lookup, and
 * productId/purchase-status are re-derived from the database here, not
 * accepted as input. See the Module 4 architecture's "Purchase
 * Eligibility" section for the exact rule this encodes.
 */
export async function submitReview(
  user: { id: string; email: string },
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const userId = user.id;
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      id: input.orderItemId,
      productId: { not: null },
      order: { userId, status: "COMPLETED" },
    },
    select: { productId: true },
  });

  if (!orderItem || !orderItem.productId) {
    return {
      success: false,
      error: "This purchase isn't eligible for a review.",
    };
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        productId: orderItem.productId,
        orderItemId: input.orderItemId,
        rating: input.rating,
        body: input.body,
      },
      select: { id: true },
    });

    // Not withAuditedMutation — this is a public customer action with no
    // Capability gating it, same reasoning as createOrder's use of
    // logActivity instead.
    await logActivity({
      actor: { id: userId, email: user.email },
      action: "review.create",
      entityType: "Review",
      entityId: review.id,
      metadata: { productId: orderItem.productId, rating: input.rating },
    });

    return { success: true };
  } catch (error) {
    // The eligibility check above is a fast-path UX check, not the
    // authoritative guard — @@unique([userId, productId]) is. Two
    // concurrent submissions can both pass the check above before either
    // writes; this converts that race into a normal user-facing result
    // instead of a 500.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "You've already reviewed this product." };
    }
    throw error;
  }
}
