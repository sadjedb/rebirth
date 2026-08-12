"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminInventoryListItem } from "@/lib/inventory/admin";

/** Handles all four variant shapes the approved Module 6 architecture
 *  supports: color+size ("Olive / M"), color-only ("Red"), size-only
 *  ("M"), and the default/legacy variant with neither ("Default") — no
 *  generic option engine, just the four display cases spelled out. */
function formatVariantIdentity(variant: { color: string | null; size: string | null }): string {
  if (variant.color && variant.size) return `${variant.color} / ${variant.size}`;
  if (variant.color) return variant.color;
  if (variant.size) return variant.size;
  return "Default";
}

function ProductCell({ variant }: { variant: AdminInventoryListItem }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/admin/products/${variant.product.id}`}
        className="text-admin-fg hover:text-admin-accent transition-colors truncate block"
      >
        {variant.product.name}
      </Link>
      <p className="text-xs text-admin-muted truncate">{formatVariantIdentity(variant)}</p>
    </div>
  );
}

function StockCell({ variant }: { variant: AdminInventoryListItem }) {
  const isOut = variant.stock <= 0;
  return (
    <div className="flex items-center gap-2">
      <span className={isOut ? "text-admin-danger font-medium" : "text-admin-fg"}>{variant.stock}</span>
      {variant.isLowStock && !isOut && (
        <Badge variant="warning">Low</Badge>
      )}
      {isOut && <Badge variant="danger">Out</Badge>}
    </div>
  );
}

function StatusCell({ variant }: { variant: AdminInventoryListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={variant.isActive ? "success" : "neutral"}>
        {variant.isActive ? "Active" : "Inactive"}
      </Badge>
      {variant.trackInventory ? (
        <Badge variant="accent">Tracked</Badge>
      ) : (
        <Badge variant="neutral">Untracked</Badge>
      )}
      {variant.continueSellingOutOfStock && <Badge variant="warning">Backorder</Badge>}
    </div>
  );
}

export function InventoryTable({
  variants,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
  filters,
}: {
  variants: AdminInventoryListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
  filters: React.ReactNode;
}) {
  const columns = useMemo<ColumnDef<AdminInventoryListItem, unknown>[]>(
    () => [
      {
        id: "product",
        // Not sortable — joined from Product / a variant-identity display
        // string, not a direct ProductVariant column, same rule Reviews'
        // reviewer/product columns already follow.
        header: "Product / Variant",
        cell: ({ row }) => <ProductCell variant={row.original} />,
      },
      {
        id: "sku",
        header: () => <DataTableColumnHeader label="SKU" sortKey="sku" />,
        cell: ({ row }) => row.original.sku ?? <span className="text-admin-muted">—</span>,
      },
      {
        id: "stock",
        header: () => <DataTableColumnHeader label="Stock" sortKey="stock" />,
        cell: ({ row }) => <StockCell variant={row.original} />,
      },
      {
        id: "lowStockThreshold",
        // Not sortable — a display-only reference value alongside the
        // low/out badges already surfaced on the Stock column; sorting by
        // it independently wouldn't answer a question the badges don't
        // already answer.
        header: "Threshold",
        cell: ({ row }) => row.original.lowStockThreshold ?? <span className="text-admin-muted">—</span>,
      },
      {
        id: "status",
        // Not sortable — three independent booleans rendered as badges,
        // same reasoning Reviews' status dropdown-filter (not a sortable
        // column) already establishes for this kind of state.
        header: "Status",
        cell: ({ row }) => <StatusCell variant={row.original} />,
      },
      {
        id: "updatedAt",
        header: () => <DataTableColumnHeader label="Updated" sortKey="updatedAt" />,
        cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={variants}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by product, SKU, color, or size…"
      filters={filters}
      emptyState={
        <EmptyState
          title={hasActiveFilters ? "No matching inventory" : "No inventory yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or clearing filters."
              : "Product variants will show up here once they exist."
          }
        />
      }
    />
  );
}
