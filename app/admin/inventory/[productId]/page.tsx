import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getProductInventoryDetail } from "@/lib/inventory/admin";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { VariantAdjustmentPanel } from "@/app/admin/inventory/[productId]/components/VariantAdjustmentPanel";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Inventory — ${brand.name} Admin`,
};

export default async function ProductInventoryPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const user = await requirePageAccess("inventory:view");
  const { productId } = await params;

  const detail = await getProductInventoryDetail(productId);
  if (!detail) notFound();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/inventory" },
          { label: detail.product.name, href: `/admin/inventory/${productId}` },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">{detail.product.name}</h1>
          <p className="text-sm text-admin-muted mt-1">
            {detail.variants.length} variant{detail.variants.length === 1 ? "" : "s"} ·{" "}
            <Link href={`/admin/products/${productId}`} className="underline hover:text-admin-fg">
              Edit product
            </Link>
          </p>
        </div>
      </div>

      <VariantAdjustmentPanel
        productId={productId}
        variants={detail.variants}
        movements={detail.movements}
        canAdjust={can(user.role, "inventory:adjust")}
      />
    </div>
  );
}
