import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import {
  getAdminInventory,
  getInventoryFilterOptions,
  type InventoryActiveFilter,
  type InventoryTrackingFilter,
  type InventoryStockFilter,
} from "@/lib/inventory/admin";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { InventoryTable } from "@/app/admin/inventory/components/InventoryTable";
import { InventoryFilters } from "@/app/admin/inventory/components/InventoryFilters";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Inventory — ${brand.name} Admin`,
};

const ACTIVE_VALUES: InventoryActiveFilter[] = ["active", "inactive"];
const TRACKING_VALUES: InventoryTrackingFilter[] = ["tracked", "untracked"];
const STOCK_VALUES: InventoryStockFilter[] = ["low", "out"];

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePageAccess("inventory:view");

  const params = await searchParams;

  const active = ACTIVE_VALUES.includes(params.active as InventoryActiveFilter)
    ? (params.active as InventoryActiveFilter)
    : undefined;
  const tracking = TRACKING_VALUES.includes(params.tracking as InventoryTrackingFilter)
    ? (params.tracking as InventoryTrackingFilter)
    : undefined;
  const stock = STOCK_VALUES.includes(params.stock as InventoryStockFilter)
    ? (params.stock as InventoryStockFilter)
    : undefined;

  const [{ items, total, pageCount, page, pageSize }, filterOptions] = await Promise.all([
    getAdminInventory({
      search: params.search,
      color: params.color,
      size: params.size,
      active,
      tracking,
      stock,
      sort: params.sort,
      dir: params.dir === "asc" ? "asc" : "desc",
      page: params.page ? Number(params.page) : 1,
    }),
    getInventoryFilterOptions(),
  ]);

  const hasActiveFilters = Boolean(
    params.search || params.color || params.size || active || tracking || stock
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/inventory" },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">Inventory</h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} variant{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <InventoryTable
        variants={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
        filters={<InventoryFilters colorOptions={filterOptions.colors} sizeOptions={filterOptions.sizes} />}
      />
    </div>
  );
}
