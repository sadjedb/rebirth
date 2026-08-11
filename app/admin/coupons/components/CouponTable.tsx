"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { CouponEffectiveStateBadge } from "@/app/admin/coupons/components/CouponEffectiveStateBadge";
import { getCouponEffectiveState } from "@/lib/coupons/status";
import type { BulkAction } from "@/components/admin/ui/BulkActionBar";
import {
  bulkSetCouponsActive,
  bulkSetCouponsDraft,
  bulkSetCouponsArchived,
} from "@/app/admin/coupons/actions";
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

function CodeCell({ coupon }: { coupon: AdminCouponListItem }) {
  // Always links — the destination page (/admin/coupons/[id]) is itself
  // gated at coupons:view (same as this list), not coupons:edit, since
  // Phase 4 added read-only usage/redemption data there too. Whether the
  // form on that page is interactive is decided on that page itself via
  // its own canEdit check, not by hiding this link.
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
  /** Gates the bulk action bar only — the code-cell link above is always
   *  shown regardless (see CodeCell's own comment). The real
   *  authorization boundary is server-side: every bulk action's
   *  withAuditedBulkMutation("coupons:edit", ...) call, not this prop. */
  canEdit: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminCouponListItem, unknown>[]>(
    () => [
      {
        id: "code",
        header: () => <DataTableColumnHeader label="Code" sortKey="code" />,
        cell: ({ row }) => <CodeCell coupon={row.original} />,
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
    []
  );

  const bulkActions = useMemo<BulkAction[]>(() => {
    if (!canEdit) return [];

    // Always offered regardless of the selection's current statuses —
    // server-side eligibility (canTransitionCouponStatus, same shared
    // helper Phase 3's single-record edit uses) decides per row what
    // actually applies, reported back via `skipped` and surfaced by
    // BulkActionBar. Same shape as Reviews' bulk action buttons.
    return [
      {
        id: "bulk-activate",
        label: "Activate",
        run: (ids) => bulkSetCouponsActive(ids),
      },
      {
        id: "bulk-draft",
        label: "Move to draft",
        run: (ids) => bulkSetCouponsDraft(ids),
      },
      {
        id: "bulk-archive",
        label: "Archive",
        variant: "danger",
        confirm: {
          title: "Archive these coupons?",
          description:
            "Archived coupons can no longer be redeemed at checkout. You can reactivate them later if needed.",
          confirmLabel: "Archive",
        },
        run: (ids) => bulkSetCouponsArchived(ids),
      },
    ];
  }, [canEdit]);

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
      bulkActions={bulkActions}
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
