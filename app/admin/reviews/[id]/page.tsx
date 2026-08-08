import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { getReviewDetail } from "@/lib/reviews/detail";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ReviewContentCard } from "@/app/admin/reviews/components/cards/ReviewContentCard";
import { ReviewerCard } from "@/app/admin/reviews/components/cards/ReviewerCard";
import { PurchaseCard } from "@/app/admin/reviews/components/cards/PurchaseCard";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Review — ${brand.name} Admin`,
};

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("reviews:view");

  const { id } = await params;
  const review = await getReviewDetail(id);

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

      {/* Read-only in Phase 3 — moderation actions (approve/reject/spam)
          are Phase 4 and intentionally not present on this card yet. */}
      <div className="space-y-6 max-w-2xl">
        <ReviewContentCard review={review} />
        <ReviewerCard review={review} />
        <PurchaseCard review={review} />
      </div>
    </div>
  );
}
