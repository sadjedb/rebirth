"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/ui/DataTable";
import { DataTableColumnHeader } from "@/components/admin/ui/DataTableColumnHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ReviewStatusBadge } from "@/app/admin/reviews/components/ReviewStatusBadge";
import type { AdminReviewListItem } from "@/lib/reviews/admin";

function ReviewerCell({ review }: { review: AdminReviewListItem }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/admin/reviews/${review.id}`}
        className="text-admin-fg hover:text-admin-accent transition-colors truncate block"
      >
        {review.reviewer.firstName} {review.reviewer.lastName}
      </Link>
      <p className="text-xs text-admin-muted truncate">{review.reviewer.email}</p>
    </div>
  );
}

function ProductCell({ review }: { review: AdminReviewListItem }) {
  return (
    <Link
      href={`/admin/products/${review.product.id}`}
      className="text-admin-fg hover:text-admin-accent transition-colors"
    >
      {review.product.name}
    </Link>
  );
}

function BodyPreviewCell({ review }: { review: AdminReviewListItem }) {
  const preview = review.body.length > 80 ? `${review.body.slice(0, 80)}…` : review.body;
  return <p className="text-admin-muted truncate max-w-xs">{preview}</p>;
}

export function ReviewTable({
  reviews,
  page,
  pageCount,
  pageSize,
  totalCount,
  hasActiveFilters,
  filters,
}: {
  reviews: AdminReviewListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  hasActiveFilters: boolean;
  filters: React.ReactNode;
}) {
  const columns = useMemo<ColumnDef<AdminReviewListItem, unknown>[]>(
    () => [
      {
        id: "reviewer",
        // Not sortable — firstName + lastName displayed together, not a
        // single Review column (same reasoning as Orders' Customer column).
        header: "Reviewer",
        cell: ({ row }) => <ReviewerCell review={row.original} />,
      },
      {
        id: "product",
        // Not sortable — joined from Product, not a direct Review column.
        header: "Product",
        cell: ({ row }) => <ProductCell review={row.original} />,
      },
      {
        id: "rating",
        header: () => <DataTableColumnHeader label="Rating" sortKey="rating" />,
        cell: ({ row }) => `${row.original.rating} / 5`,
      },
      {
        id: "body",
        header: "Review",
        cell: ({ row }) => <BodyPreviewCell review={row.original} />,
      },
      {
        id: "status",
        // Not sortable via this column — status filtering is handled by
        // ReviewFilters' dropdown instead, matching how Products' status
        // filter works (a dropdown, not a sortable column click).
        header: "Status",
        cell: ({ row }) => <ReviewStatusBadge status={row.original.status} />,
      },
      {
        id: "createdAt",
        header: () => <DataTableColumnHeader label="Submitted" sortKey="createdAt" />,
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
      data={reviews}
      getRowId={(row) => row.id}
      page={page}
      pageCount={pageCount}
      pageSize={pageSize}
      totalCount={totalCount}
      searchPlaceholder="Search by reviewer, product, or review text…"
      filters={filters}
      emptyState={
        <EmptyState
          title={hasActiveFilters ? "No matching reviews" : "No reviews yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or clearing filters."
              : "Reviews submitted by customers will show up here."
          }
        />
      }
    />
  );
}
