"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";

export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  totalCount,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function hrefForPage(target: number) {
    return buildListUrl(pathname, searchParams, { page: String(target) });
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border text-sm">
      <p className="text-admin-muted">
        {totalCount === 0
          ? "0 results"
          : `${rangeStart}–${rangeEnd} of ${totalCount}`}
      </p>

      <div className="flex items-center gap-1">
        <PageLink href={hrefForPage(page - 1)} disabled={page <= 1}>
          Previous
        </PageLink>
        <span className="px-2 text-admin-muted">
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        <PageLink href={hrefForPage(page + 1)} disabled={page >= pageCount}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-1.5 rounded-md text-admin-muted/40 cursor-not-allowed">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-admin-fg hover:bg-admin-surface-hover transition-colors"
    >
      {children}
    </Link>
  );
}
