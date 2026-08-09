import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CouponForm } from "@/app/admin/coupons/components/CouponForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `New coupon — ${brand.name} Admin`,
};

export default async function NewCouponPage() {
  await requirePageAccess("coupons:create");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
          { label: "New" },
        ]}
      />

      <h1 className="text-2xl font-semibold text-admin-fg mt-3 mb-6">New coupon</h1>

      <CouponForm mode="create" />
    </div>
  );
}
