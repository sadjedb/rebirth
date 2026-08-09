import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { getAdminCouponById } from "@/lib/coupons/admin";
import { couponToFormState } from "@/app/admin/coupons/components/coupon-form-state";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CouponForm } from "@/app/admin/coupons/components/CouponForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Edit coupon — ${brand.name} Admin`,
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("coupons:edit");

  const { id } = await params;
  const coupon = await getAdminCouponById(id);

  if (!coupon) notFound();

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

      <CouponForm
        mode="edit"
        couponId={coupon.id}
        initialFormState={couponToFormState(coupon)}
        usageInfo={{
          usageCount: coupon.usageCount,
          usageLimit: coupon.usageLimit,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt,
        }}
      />
    </div>
  );
}
