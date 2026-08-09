"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { CouponEffectiveStateBadge } from "@/app/admin/coupons/components/CouponEffectiveStateBadge";
import { getCouponEffectiveState } from "@/lib/coupons/status";
import type { AdminCouponListItem } from "@/lib/coupons/admin";

function DiscountCell({ coupon }: { coupon: AdminCouponListItem }) {
  return coupon.discountType === "PERCENTAGE" ? (
    <span>{coupon.discountValue}%</span>
  ) : (
    <span>${coupon.discountValue}</span>
  );
}

function UsageCell({ coupon }: { coupon: AdminCouponListItem }) {
  return (
    <span>
      {coupon.usageCount}
      {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
    </span>
  );
}

function CodeCell({ coupon, canEdit }: { coupon: AdminCouponListItem; canEdit: boolean }) {
  if (!canEdit) {
    return <span className="font-mono text-admin-fg">{coupon.code}</span>;
  }
  return (
    <Link
      href={`/admin/coupons/${coupon.id}`}
      className="font-mono text-admin-fg hover:text-admin-accent transition-colors"
    >
      {coupon.code}
    </Link>
  );
}

export function CouponTable({
  coupons,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
  filters,
  canEdit,
}: {
  coupons: AdminCouponListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
  filters: React.ReactNode;
  /** Direct URL access to /admin/coupons/[id] is also protected
   *  server-side (requirePageAccess("coupons:edit") on that page) — this
   *  just hides the affordance for users who can't use it. */
  canEdit: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminCouponListItem, unknown>[]>(
    () => [
      {
        id: "code",
        header: () => <DataTableColumnHeader label="Code" sortKey="code" />,
        cell: ({ row }) => <CodeCell coupon={row.original} canEdit={canEdit} />,
      },
      {
        id: "discountValue",
        header: () => <DataTableColumnHeader label="Discount" sortKey="discountValue" />,
        cell: ({ row }) => <DiscountCell coupon={row.original} />,
      },
      {
        id: "usageCount",
        header: () => <DataTableColumnHeader label="Usage" sortKey="usageCount" />,
        cell: ({ row }) => <UsageCell coupon={row.original} />,
      },
      {
        id: "status",
        // Not sortable via this column — filtered by CouponFilters'
        // dropdown instead, same convention as Reviews' status column.
        header: "Status",
        cell: ({ row }) => (
          <CouponEffectiveStateBadge state={getCouponEffectiveState(row.original)} />
        ),
      },
      {
        id: "createdAt",
        header: () => <DataTableColumnHeader label="Created" sortKey="createdAt" />,
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
    ],
    [canEdit]
  );

  return (
    <DataTable
      columns={columns}
      data={coupons}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by code or description…"
      filters={filters}
      emptyState={
        <EmptyState
          title={hasActiveFilters ? "No matching coupons" : "No coupons yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or clearing filters."
              : "Coupons you create will show up here."
          }
        />
      }
    />
  );
}
