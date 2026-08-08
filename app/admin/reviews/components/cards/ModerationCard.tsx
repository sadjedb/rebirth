"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { useToast } from "@/components/admin/ui/Toast";
import { ReviewStatusBadge } from "@/app/admin/reviews/components/ReviewStatusBadge";
import {
  approveReview,
  rejectReview,
  markReviewAsSpam,
  resetReviewToPending,
} from "@/app/admin/reviews/[id]/actions";
import { getAllowedReviewStatusTransitions } from "@/lib/reviews/status";
import type { ReviewMutationResult } from "@/app/admin/reviews/[id]/actions";
import type { ReviewDetail } from "@/lib/reviews/detail";
import type { ReviewStatus } from "@prisma/client";

const ACTION_BUTTONS: Record<
  ReviewStatus,
  { label: string; successLabel: string; variant: "default" | "danger" }
> = {
  PENDING: { label: "Reset to pending", successLabel: "Review reset to pending", variant: "default" },
  APPROVED: { label: "Approve", successLabel: "Review approved", variant: "default" },
  REJECTED: { label: "Reject", successLabel: "Review rejected", variant: "danger" },
  SPAM: { label: "Mark as spam", successLabel: "Review marked as spam", variant: "danger" },
};

const MUTATIONS: Record<
  ReviewStatus,
  (id: string, updatedAt: string) => Promise<ReviewMutationResult>
> = {
  PENDING: resetReviewToPending,
  APPROVED: approveReview,
  REJECTED: rejectReview,
  SPAM: markReviewAsSpam,
};

export function ModerationCard({
  review,
  canModerate,
}: {
  review: ReviewDetail;
  canModerate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  if (!canModerate) {
    return (
      <FormCard title="Moderation">
        <DetailField label="Status">
          <ReviewStatusBadge status={review.status} />
        </DetailField>
      </FormCard>
    );
  }

  const allowedTargets = getAllowedReviewStatusTransitions(review.status).filter(
    (status) => status !== review.status
  );

  function runMutation(to: ReviewStatus) {
    startTransition(async () => {
      const result = await MUTATIONS[to](review.id, review.updatedAt.toISOString());
      if (result.success) {
        toast({ variant: "success", title: ACTION_BUTTONS[to].successLabel });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't update review", description: result.error });
      }
    });
  }

  return (
    <FormCard title="Moderation">
      <DetailField label="Status">
        <ReviewStatusBadge status={review.status} />
      </DetailField>

      {allowedTargets.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {allowedTargets.map((to) => {
            const button = ACTION_BUTTONS[to];
            return (
              <button
                key={to}
                type="button"
                disabled={isPending}
                onClick={() => runMutation(to)}
                className={
                  button.variant === "danger"
                    ? "px-3 py-1.5 text-sm rounded-md border border-admin-danger text-admin-danger hover:bg-admin-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    : "px-3 py-1.5 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                }
              >
                {button.label}
              </button>
            );
          })}
        </div>
      )}
    </FormCard>
  );
}
