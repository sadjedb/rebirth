"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { formatMoney } from "@/lib/money";
import type { AdminCustomerListItem } from "@/lib/customers/admin";

function CustomerNameCell({ customer }: { customer: AdminCustomerListItem }) {
  return (
    <Link
      href={`/admin/customers/${customer.id}`}
      className="text-admin-fg hover:text-admin-accent transition-colors"
    >
      {customer.firstName} {customer.lastName}
    </Link>
  );
}

export function CustomerTable({
  customers,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
}: {
  customers: AdminCustomerListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminCustomerListItem, unknown>[]>(
    () => [
      {
        id: "name",
        header: () => <DataTableColumnHeader label="Name" sortKey="name" />,
        cell: ({ row }) => <CustomerNameCell customer={row.original} />,
      },
      {
        id: "email",
        header: () => <DataTableColumnHeader label="Email" sortKey="email" />,
        cell: ({ row }) => row.original.email,
      },
      {
        id: "orderCount",
        // Not sortable — an aggregate, not a column on User. See the
        // SORTABLE_COLUMNS comment in lib/customers/admin.ts.
        header: "Orders",
        cell: ({ row }) => row.original.orderCount,
      },
      {
        id: "totalSpent",
        header: "Total spent",
        cell: ({ row }) => formatMoney(row.original.totalSpent),
      },
      {
        id: "lastOrderAt",
        header: "Last order",
        cell: ({ row }) =>
          row.original.lastOrderAt
            ? new Date(row.original.lastOrderAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—",
      },
      {
        id: "createdAt",
        header: () => <DataTableColumnHeader label="Joined" sortKey="createdAt" />,
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

  return (
    <DataTable
      columns={columns}
      data={customers}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by name or email…"
      emptyState={
        <EmptyState
          title={hasActiveFilters ? "No matching customers" : "No customers yet"}
          description={
            hasActiveFilters
              ? "Try a different search term."
              : "Registered customers will show up here."
          }
        />
      }
    />
  );
}
