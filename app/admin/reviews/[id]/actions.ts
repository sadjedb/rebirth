"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAuditedMutation } from "@/lib/audit";
import { checkPermission } from "@/lib/admin/auth";
import { assertNotStale, ConcurrencyError } from "@/lib/admin/concurrency";
import { resolveReviewStatusTransition } from "@/lib/reviews/status";
import type { ReviewStatus } from "@prisma/client";

export type ReviewMutationResult =
  | { success: true }
  | { success: false; error: string; conflict?: boolean };

function revalidateReview(id: string) {
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${id}`);
}

/** Mirrors checkNotStale in app/admin/orders/[id]/actions.ts. */
function checkNotStale(submittedUpdatedAt: string, currentUpdatedAt: Date): ReviewMutationResult | null {
  try {
    assertNotStale(submittedUpdatedAt, currentUpdatedAt);
    return null;
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        success: false,
        conflict: true,
        error: "This review was changed by someone else. Reload the page to see the latest version.",
      };
    }
    throw error;
  }
}

/**
 * Shared by all four moderation actions below — each is just this with a
 * different `to`. checkPermission runs first as an early gate (so an
 * unauthorized caller never triggers the existence/staleness queries);
 * withAuditedMutation's own internal assertPermission is the actual
 * enforcement for the mutation itself — same double-check shape as
 * updateOrderStatus in app/admin/orders/[id]/actions.ts.
 */
async function changeReviewStatus(
  id: string,
  updatedAt: string,
  to: ReviewStatus
): Promise<ReviewMutationResult> {
  const authError = await checkPermission("reviews:moderate");
  if (authError) return authError;

  const existing = await prisma.review.findUnique({
    where: { id },
    select: { status: true, updatedAt: true },
  });
  if (!existing) return { success: false, error: "This review no longer exists." };

  const staleResult = checkNotStale(updatedAt, existing.updatedAt);
  if (staleResult) return staleResult;

  const transition = resolveReviewStatusTransition(existing.status, to);
  if (!transition.ok) return { success: false, error: transition.error };
  // Same-value "transition" — nothing changed, nothing to audit.
  if (!transition.audit) return { success: true };

  const audit = transition.audit;
  return withAuditedMutation(
    "reviews:moderate",
    { action: audit.action, entityType: "Review" },
    async () => {
      await prisma.review.update({ where: { id }, data: { status: to } });
      revalidateReview(id);
      return { result: { success: true as const }, entityId: id, metadata: audit.metadata };
    }
  );
}

export async function approveReview(id: string, updatedAt: string): Promise<ReviewMutationResult> {
  return changeReviewStatus(id, updatedAt, "APPROVED");
}

export async function rejectReview(id: string, updatedAt: string): Promise<ReviewMutationResult> {
  return changeReviewStatus(id, updatedAt, "REJECTED");
}

export async function markReviewAsSpam(id: string, updatedAt: string): Promise<ReviewMutationResult> {
  return changeReviewStatus(id, updatedAt, "SPAM");
}

export async function resetReviewToPending(id: string, updatedAt: string): Promise<ReviewMutationResult> {
  return changeReviewStatus(id, updatedAt, "PENDING");
}
