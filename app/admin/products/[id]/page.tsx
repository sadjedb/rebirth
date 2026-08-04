import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getAdminProductById, getCollectionOptions, getTagOptions } from "@/lib/products/admin";
import { getCategories } from "@/lib/products/storefront";
import { productToFormState } from "@/app/admin/products/components/product-form-state";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ProductForm } from "@/app/admin/products/components/ProductForm";
import { DeleteProductButton } from "@/app/admin/products/components/DeleteProductButton";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Edit product — ${brand.name} Admin`,
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageAccess("products:edit");

  const { id } = await params;

  const [product, categories, collections, tags] = await Promise.all([
    getAdminProductById(id),
    getCategories(),
    getCollectionOptions(),
    getTagOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <h1 className="text-2xl font-semibold text-admin-fg">Edit product</h1>
        {can(user.role, "products:delete") && <DeleteProductButton productId={product.id} />}
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        initialFormState={productToFormState(product)}
        categories={categories.map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }))}
        collections={collections.map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }))}
        tags={tags.map((t: { id: string; name: string }) => ({ id: t.id, label: t.name }))}
      />
    </div>
  );
}
