"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber } from "@/lib/orders/format";
import type { AdminOrderListItem } from "@/lib/orders/admin";
import type { BulkAction } from "@/components/admin/ui/BulkActionBar";
import {
  bulkUpdateOrderStatus,
  bulkUpdateOrderPaymentStatus,
  bulkUpdateOrderFulfillmentStatus,
} from "@/app/admin/orders/actions";
import { OrderStatusBadge } from "@/app/admin/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/app/admin/orders/components/PaymentStatusBadge";
import { FulfillmentStatusBadge } from "@/app/admin/orders/components/FulfillmentStatusBadge";

function OrderNumberCell({ order }: { order: AdminOrderListItem }) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="font-mono text-admin-fg hover:text-admin-accent transition-colors"
    >
      {formatOrderNumber(order.orderNumber)}
    </Link>
  );
}

function CustomerCell({ order }: { order: AdminOrderListItem }) {
  return (
    <div className="min-w-0">
      <p className="text-admin-fg truncate">
        {order.firstName} {order.lastName}
      </p>
      <p className="text-xs text-admin-muted truncate">{order.email}</p>
    </div>
  );
}

export function OrderTable({
  orders,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
  filters,
  canEdit,
  canCancel,
}: {
  orders: AdminOrderListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
  filters: React.ReactNode;
  canEdit: boolean;
  canCancel: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminOrderListItem, unknown>[]>(
    () => [
      {
        id: "orderNumber",
        header: () => <DataTableColumnHeader label="Order" sortKey="orderNumber" />,
        cell: ({ row }) => <OrderNumberCell order={row.original} />,
      },
      {
        id: "customer",
        // Not sortable — "Customer" is firstName + lastName displayed
        // together, not a single column (same reason Products' Category
        // column isn't sortable: it's not a direct scalar).
        header: "Customer",
        cell: ({ row }) => <CustomerCell order={row.original} />,
      },
      {
        id: "total",
        header: () => <DataTableColumnHeader label="Total" sortKey="total" />,
        cell: ({ row }) => formatMoney(row.original.total, row.original.currency),
      },
      {
        id: "status",
        header: () => <DataTableColumnHeader label="Order status" sortKey="status" />,
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        id: "paymentStatus",
        header: () => <DataTableColumnHeader label="Payment" sortKey="paymentStatus" />,
        cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
      },
      {
        id: "fulfillmentStatus",
        header: () => <DataTableColumnHeader label="Fulfillment" sortKey="fulfillmentStatus" />,
        cell: ({ row }) => <FulfillmentStatusBadge status={row.original.fulfillmentStatus} />,
      },
      {
        id: "createdAt",
        header: () => <DataTableColumnHeader label="Date" sortKey="createdAt" />,
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
    const actions: BulkAction[] = [];
    if (canEdit) {
      actions.push(
        {
          id: "bulk-mark-processing",
          label: "Mark Processing",
          run: (ids) => bulkUpdateOrderStatus(ids, "PROCESSING"),
        },
        {
          id: "bulk-mark-completed",
          label: "Mark Completed",
          run: (ids) => bulkUpdateOrderStatus(ids, "COMPLETED"),
        },
        {
          id: "bulk-mark-paid",
          label: "Mark Paid",
          run: (ids) => bulkUpdateOrderPaymentStatus(ids, "PAID"),
        },
        {
          id: "bulk-mark-fulfilled",
          label: "Mark Fulfilled",
          run: (ids) => bulkUpdateOrderFulfillmentStatus(ids, "FULFILLED"),
        }
      );
    }
    if (canCancel) {
      actions.push({
        id: "bulk-cancel",
        label: "Cancel",
        variant: "danger",
        confirm: {
          title: "Cancel these orders?",
          description:
            "Orders already completed, or with no eligible transition, will be skipped rather than cancelled.",
          confirmLabel: "Cancel orders",
        },
        run: (ids) => bulkUpdateOrderStatus(ids, "CANCELLED"),
      });
    }
    return actions;
  }, [canEdit, canCancel]);

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by order #, name, or email…"
      filters={filters}
      bulkActions={bulkActions}
      emptyState={
        <EmptyState
          title={hasActiveFilters ? "No matching orders" : "No orders yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or clearing filters."
              : "Orders placed at checkout will show up here."
          }
        />
      }
    />
  );
}
