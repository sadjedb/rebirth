import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { getAdminCoupons } from "@/lib/coupons/admin";
import { COUPON_STATUSES } from "@/lib/coupons/status";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CouponTable } from "@/app/admin/coupons/components/CouponTable";
import { CouponFilters } from "@/app/admin/coupons/components/CouponFilters";
import { brand } from "@/config/brand";
import type { CouponStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Coupons — ${brand.name} Admin`,
};

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePageAccess("coupons:view");

  const params = await searchParams;
  const status = COUPON_STATUSES.includes(params.status as CouponStatus)
    ? (params.status as CouponStatus)
    : undefined;

  const { items, total, pageCount, page, pageSize } = await getAdminCoupons({
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
          { label: "Coupons", href: "/admin/coupons" },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">Coupons</h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} coupon{total === 1 ? "" : "s"}
          </p>
        </div>
        {/* No "New coupon" link yet — Create/Edit is Phase 3. */}
      </div>

      <CouponTable
        coupons={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
        filters={<CouponFilters />}
      />
    </div>
  );
}
