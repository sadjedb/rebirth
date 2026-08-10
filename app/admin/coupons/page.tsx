import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
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
  const user = await requirePageAccess("coupons:view");

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
  const canCreate = can(user.role, "coupons:create");

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
        {/* Server-gated: direct URL access to /admin/coupons/new is also
            protected by requirePageAccess("coupons:create") on that page
            itself — this hides the control, not the only protection. */}
        {canCreate && (
          <Link
            href="/admin/coupons/new"
            className="px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity"
          >
            New coupon
          </Link>
        )}
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
