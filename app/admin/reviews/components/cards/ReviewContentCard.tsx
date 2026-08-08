import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { ReviewStatusBadge } from "@/app/admin/reviews/components/ReviewStatusBadge";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { ReviewDetail } from "@/lib/reviews/detail";

export function ReviewContentCard({ review }: { review: ReviewDetail }) {
  return (
    <FormCard title="Review">
      <DetailField label="Status">
        <ReviewStatusBadge status={review.status} />
      </DetailField>
      <DetailField label="Rating">{review.rating} / 5</DetailField>
      <DetailField label="Review text">
        <p className="whitespace-pre-wrap">{review.body}</p>
      </DetailField>
      <DetailField label="Submitted">{formatOrderTimestamp(review.createdAt)}</DetailField>
      {review.updatedAt.getTime() !== review.createdAt.getTime() && (
        <DetailField label="Last updated">{formatOrderTimestamp(review.updatedAt)}</DetailField>
      )}
    </FormCard>
  );
}
