import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { getCategories } from "@/lib/products/storefront";
import { getCollectionOptions, getTagOptions } from "@/lib/products/admin";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ProductForm } from "@/app/admin/products/components/ProductForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `New product — ${brand.name} Admin`,
};

export default async function NewProductPage() {
  await requirePageAccess("products:create");

  const [categories, collections, tags] = await Promise.all([
    getCategories(),
    getCollectionOptions(),
    getTagOptions(),
  ]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />

      <h1 className="text-2xl font-semibold text-admin-fg mt-3 mb-6">New product</h1>

      <ProductForm
        mode="create"
        categories={categories.map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }))}
        collections={collections.map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }))}
        tags={tags.map((t: { id: string; name: string }) => ({ id: t.id, label: t.name }))}
      />
    </div>
  );
}
