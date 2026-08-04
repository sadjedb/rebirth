import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getAdminProducts } from "@/lib/products/admin";
import { getCategories } from "@/lib/products/storefront";
import { PRODUCT_STATUSES } from "@/lib/products/status";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { ProductTable } from "@/app/admin/products/components/ProductTable";
import { ProductFilters } from "@/app/admin/products/components/ProductFilters";
import { brand } from "@/config/brand";
import type { ProductStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Products — ${brand.name} Admin`,
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePageAccess("products:view");

  const params = await searchParams;
  const trashView = params.view === "trash";
  const status = PRODUCT_STATUSES.includes(params.status as ProductStatus)
    ? (params.status as ProductStatus)
    : undefined;

  const [{ items, total, pageCount, page, pageSize }, categories] = await Promise.all([
    getAdminProducts({
      search: params.search,
      status,
      categoryId: params.categoryId,
      sort: params.sort,
      dir: params.dir === "asc" ? "asc" : "desc",
      page: params.page ? Number(params.page) : 1,
      trashed: trashView,
    }),
    getCategories(),
  ]);

  const hasActiveFilters = Boolean(params.search || params.status || params.categoryId);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          ...(trashView ? [{ label: "Trash" }] : []),
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">
            {trashView ? "Trash" : "Products"}
          </h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} {trashView ? "trashed " : ""}product{total === 1 ? "" : "s"}
          </p>
        </div>
        {!trashView && (
          <Link
            href="/admin/products/new"
            className="px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity"
          >
            New product
          </Link>
        )}
      </div>

      <div className="mb-6">
        {trashView ? (
          <Link href="/admin/products" className="text-sm text-admin-accent hover:underline">
            ← Back to products
          </Link>
        ) : (
          can(user.role, "products:delete") && (
            <Link
              href="/admin/products?view=trash"
              className="text-sm text-admin-muted hover:text-admin-fg transition-colors"
            >
              View trash
            </Link>
          )
        )}
      </div>

      <ProductTable
        products={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
        filters={<ProductFilters categories={categories} />}
        trashView={trashView}
        canDelete={can(user.role, "products:delete")}
        canRestore={can(user.role, "products:restore")}
        canPermanentlyDelete={can(user.role, "products:permanently_delete")}
        canEdit={can(user.role, "products:edit")}
      />
    </div>
  );
}
