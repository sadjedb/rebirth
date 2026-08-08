import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getReviewDetail } from "@/lib/reviews/detail";
import { getReviewTimeline } from "@/lib/reviews/timeline";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ReviewContentCard } from "@/app/admin/reviews/components/cards/ReviewContentCard";
import { ReviewerCard } from "@/app/admin/reviews/components/cards/ReviewerCard";
import { PurchaseCard } from "@/app/admin/reviews/components/cards/PurchaseCard";
import { ModerationCard } from "@/app/admin/reviews/components/cards/ModerationCard";
import { ReviewTimeline } from "@/app/admin/reviews/components/ReviewTimeline";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Review — ${brand.name} Admin`,
};

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageAccess("reviews:view");

  const { id } = await params;
  const [review, timeline] = await Promise.all([getReviewDetail(id), getReviewTimeline(id)]);

  if (!review) notFound();

  const reviewerName = `${review.reviewer.firstName} ${review.reviewer.lastName}`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reviews", href: "/admin/reviews" },
          { label: `${review.product.name} — ${reviewerName}` },
        ]}
      />

      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold text-admin-fg">
          {review.product.name} — {review.rating} / 5
        </h1>
        <p className="text-sm text-admin-muted mt-1">Reviewed by {reviewerName}</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <ModerationCard review={review} canModerate={can(user.role, "reviews:moderate")} />
        <ReviewContentCard review={review} />
        <ReviewerCard review={review} />
        <PurchaseCard review={review} />
        <ReviewTimeline entries={timeline} />
      </div>
    </div>
  );
}
