"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Badge } from "@/components/admin/ui/Badge";
import { formatMoney } from "@/lib/money";
import type { AdminProductListItem } from "@/lib/products/admin";
import { ProductStatusBadge } from "@/app/admin/products/components/ProductStatusBadge";
import { ProductRowActions } from "@/app/admin/products/components/ProductRowActions";
import type { BulkAction } from "@/components/admin/ui/BulkActionBar";
import {
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  bulkRestoreProducts,
  bulkPermanentlyDeleteProducts,
} from "@/app/admin/products/actions";

function ProductCell({ product, linkToEdit }: { product: AdminProductListItem; linkToEdit: boolean }) {
  const thumbnail = product.media[0];
  const content = (
    <>
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- small fixed-size admin thumbnail, not worth next/image's overhead here
        <img
          src={thumbnail.url}
          alt={thumbnail.altText ?? ""}
          className="w-9 h-9 rounded object-cover shrink-0 border border-admin-border"
        />
      ) : (
        <div
          className="w-9 h-9 rounded shrink-0 border border-admin-border"
          style={{ backgroundColor: product.tone ?? "#E4E0D6" }}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0">
        <p className="text-admin-fg truncate">{product.name}</p>
        <p className="text-xs text-admin-muted truncate">{product.sku ?? product.code}</p>
      </div>
    </>
  );

  if (!linkToEdit) {
    return <div className="flex items-center gap-3 min-w-[220px]">{content}</div>;
  }

  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="flex items-center gap-3 min-w-[220px] hover:opacity-80 transition-opacity"
    >
      {content}
    </Link>
  );
}

export function ProductTable({
  products,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
  filters,
  trashView = false,
  canDelete = false,
  canRestore = false,
  canPermanentlyDelete = false,
  canEdit = false,
}: {
  products: AdminProductListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
  filters: React.ReactNode;
  trashView?: boolean;
  canDelete?: boolean;
  canRestore?: boolean;
  canPermanentlyDelete?: boolean;
  canEdit?: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminProductListItem, unknown>[]>(
    () => [
      {
        id: "product",
        header: () => <DataTableColumnHeader label="Product" sortKey="name" />,
        cell: ({ row }) => <ProductCell product={row.original} linkToEdit={!trashView} />,
      },
      {
        id: "status",
        header: () => <DataTableColumnHeader label="Status" sortKey="status" />,
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-admin-muted">{row.original.category?.name ?? "—"}</span>
        ),
      },
      {
        id: "price",
        header: () => <DataTableColumnHeader label="Price" sortKey="price" />,
        cell: ({ row }) => formatMoney(row.original.price),
      },
      {
        id: "stock",
        header: () => <DataTableColumnHeader label="Stock" sortKey="stock" />,
        cell: ({ row }) => {
          const product = row.original;
          const isLow =
            product.trackInventory &&
            product.lowStockThreshold != null &&
            product.stock <= product.lowStockThreshold;
          return (
            <div className="flex items-center gap-2">
              <span>{product.trackInventory ? product.stock : "—"}</span>
              {isLow && <Badge variant="warning">Low</Badge>}
            </div>
          );
        },
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ProductRowActions
            productId={row.original.id}
            productName={row.original.name}
            trashView={trashView}
            canDelete={canDelete}
            canRestore={canRestore}
            canPermanentlyDelete={canPermanentlyDelete}
          />
        ),
      },
    ],
    [trashView, canDelete, canRestore, canPermanentlyDelete]
  );

  const bulkActions = useMemo<BulkAction[]>(() => {
    if (trashView) {
      const actions: BulkAction[] = [];
      if (canRestore) {
        actions.push({
          id: "bulk-restore",
          label: "Restore",
          run: (ids) => bulkRestoreProducts(ids),
        });
      }
      if (canPermanentlyDelete) {
        actions.push({
          id: "bulk-permanently-delete",
          label: "Delete forever",
          variant: "danger",
          confirm: {
            title: "Permanently delete these products?",
            description:
              "This cannot be undone. Each product, its media, and its organization associations will be permanently removed. Order history is unaffected.",
            confirmLabel: "Delete forever",
            requireTextMatch: (count) => `DELETE ${count} PRODUCTS`,
          },
          run: (ids) => bulkPermanentlyDeleteProducts(ids),
        });
      }
      return actions;
    }

    const actions: BulkAction[] = [];
    if (canEdit) {
      actions.push(
        {
          id: "bulk-publish",
          label: "Publish",
          run: (ids) => bulkUpdateProductStatus(ids, "ACTIVE"),
        },
        {
          id: "bulk-archive",
          label: "Archive",
          run: (ids) => bulkUpdateProductStatus(ids, "ARCHIVED"),
        }
      );
    }
    if (canDelete) {
      actions.push({
        id: "bulk-delete",
        label: "Delete",
        variant: "danger",
        confirm: {
          title: "Move these products to trash?",
          description: "They'll disappear from the storefront and this list. You can restore them from the trash at any time.",
          confirmLabel: "Move to trash",
        },
        run: (ids) => bulkDeleteProducts(ids),
      });
    }
    return actions;
  }, [trashView, canEdit, canDelete, canRestore, canPermanentlyDelete]);

  return (
    <DataTable
      columns={columns}
      data={products}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by name, SKU, or code…"
      filters={filters}
      bulkActions={bulkActions}
      emptyState={
        <EmptyState
          title={
            hasActiveFilters
              ? "No matching products"
              : trashView
              ? "Trash is empty"
              : "No products yet"
          }
          description={
            hasActiveFilters
              ? "Try a different search term or clearing filters."
              : trashView
              ? "Deleted products will show up here."
              : "Products created in the admin will show up here."
          }
        />
      }
    />
  );
}
