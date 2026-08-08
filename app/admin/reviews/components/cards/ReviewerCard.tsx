import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import type { ReviewDetail } from "@/lib/reviews/detail";

export function ReviewerCard({ review }: { review: ReviewDetail }) {
  return (
    <FormCard title="Reviewer">
      <DetailField label="Name">
        <Link
          href={`/admin/customers/${review.reviewer.id}`}
          className="text-admin-accent hover:underline"
        >
          {review.reviewer.firstName} {review.reviewer.lastName}
        </Link>
      </DetailField>
      <DetailField label="Email">{review.reviewer.email}</DetailField>
    </FormCard>
  );
}
