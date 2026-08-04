"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/admin/ui/Checkbox";
import { DataTableToolbar } from "@/components/admin/ui/DataTableToolbar";
import type { BulkAction } from "@/components/admin/ui/BulkActionBar";
import { DataTablePagination } from "@/components/admin/ui/DataTablePagination";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId: (row: TData) => string;
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  searchPlaceholder?: string;
  filters?: ReactNode;
  bulkActions?: BulkAction[];
  emptyState: ReactNode;
};

const SELECT_COLUMN_ID = "__select";

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  page,
  pageCount,
  pageSize,
  totalCount,
  searchPlaceholder,
  filters,
  bulkActions,
  emptyState,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // `data` is server-provided and gets a fresh array reference on every
  // navigation (pagination, sort, filter, search) and after a bulk-action
  // triggers router.refresh() — this component itself never remounts
  // across those transitions (manual/URL-driven pagination), so without
  // this the previous page's selection would silently persist: the bulk
  // bar would keep showing "N selected" and running actions against ids
  // no longer visible on screen, with no checkbox on the page reflecting it.
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  const columnsWithSelection: ColumnDef<TData, unknown>[] = [
    {
      id: SELECT_COLUMN_ID,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      ),
      size: 36,
    },
    ...columns,
  ];

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    enableRowSelection: true,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  return (
    <div className="rounded-lg border border-admin-border bg-admin-bg overflow-hidden">
      <DataTableToolbar
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        selectedIds={selectedIds}
        bulkActions={bulkActions}
      />

      {data.length === 0 ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-admin-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-2.5 font-normal"
                      style={header.column.id === SELECT_COLUMN_ID ? { width: 44 } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors data-[state=selected]:bg-admin-accent/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-admin-fg align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DataTablePagination page={page} pageCount={pageCount} pageSize={pageSize} totalCount={totalCount} />
    </div>
  );
}
