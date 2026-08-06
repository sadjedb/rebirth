import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { getAdminCustomers } from "@/lib/customers/admin";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CustomerTable } from "@/app/admin/customers/components/CustomerTable";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Customers — ${brand.name} Admin`,
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePageAccess("customers:view");

  const params = await searchParams;

  const { items, total, pageCount, page, pageSize } = await getAdminCustomers({
    search: params.search,
    sort: params.sort,
    dir: params.dir === "asc" ? "asc" : "desc",
    page: params.page ? Number(params.page) : 1,
  });

  const hasActiveFilters = Boolean(params.search);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">Customers</h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} customer{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <CustomerTable
        customers={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
