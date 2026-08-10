import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getCouponDetail, getCouponRedemptions } from "@/lib/coupons/detail";
import { couponToFormState } from "@/app/admin/coupons/components/coupon-form-state";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CouponForm } from "@/app/admin/coupons/components/CouponForm";
import { UsageStatsCard } from "@/app/admin/coupons/components/cards/UsageStatsCard";
import { RedemptionsCard } from "@/app/admin/coupons/components/cards/RedemptionsCard";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Coupon — ${brand.name} Admin`,
};

export default async function CouponDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Gated at coupons:view, not coupons:edit — this page also carries
  // read-only usage/redemption data Staff should be able to see. The
  // actual mutation stays independently protected by updateCoupon's own
  // checkPermission("coupons:edit"); CouponForm's canEdit prop below
  // only controls whether the form is interactive, not whether the
  // mutation would be accepted.
  const user = await requirePageAccess("coupons:view");

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const redemptionsPage = pageParam ? Number(pageParam) : 1;

  const coupon = await getCouponDetail(id);
  if (!coupon) notFound();

  const redemptions = await getCouponRedemptions(id, redemptionsPage);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
          { label: coupon.code },
        ]}
      />

      <h1 className="text-2xl font-semibold text-admin-fg mt-3 mb-6 font-mono">{coupon.code}</h1>

      <div className="space-y-6">
        <CouponForm
          mode="edit"
          couponId={coupon.id}
          initialFormState={couponToFormState(coupon)}
          canEdit={can(user.role, "coupons:edit")}
          usageInfo={{
            usageCount: coupon.usageCount,
            usageLimit: coupon.usageLimit,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RedemptionsCard
              redemptions={redemptions.items}
              page={redemptions.page}
              pageCount={redemptions.pageCount}
              pageSize={redemptions.pageSize}
              totalCount={redemptions.total}
            />
          </div>
          <div className="space-y-6">
            <UsageStatsCard coupon={coupon} />
          </div>
        </div>
      </div>
    </div>
  );
}
