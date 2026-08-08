import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getAdminReviews } from "@/lib/reviews/admin";
import { REVIEW_STATUSES } from "@/lib/reviews/status";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ReviewTable } from "@/app/admin/reviews/components/ReviewTable";
import { ReviewFilters } from "@/app/admin/reviews/components/ReviewFilters";
import { brand } from "@/config/brand";
import type { ReviewStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Reviews — ${brand.name} Admin`,
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePageAccess("reviews:view");

  const params = await searchParams;
  const status = REVIEW_STATUSES.includes(params.status as ReviewStatus)
    ? (params.status as ReviewStatus)
    : undefined;

  const { items, total, pageCount, page, pageSize } = await getAdminReviews({
    search: params.search,
    status,
    sort: params.sort,
    dir: params.dir === "asc" ? "asc" : "desc",
    page: params.page ? Number(params.page) : 1,
  });

  const hasActiveFilters = Boolean(params.search || params.status);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reviews", href: "/admin/reviews" },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">Reviews</h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} review{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ReviewTable
        reviews={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
        filters={<ReviewFilters />}
        canModerate={can(user.role, "reviews:moderate")}
      />
    </div>
  );
}
