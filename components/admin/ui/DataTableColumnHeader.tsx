"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";

export function DataTableColumnHeader({
  label,
  sortKey,
}: {
  label: string;
  sortKey: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const isActive = currentSort === sortKey;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const href = buildListUrl(pathname, searchParams, { sort: sortKey, dir: nextDir });

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-admin-muted hover:text-admin-fg transition-colors"
    >
      {label}
      <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}>
        {currentDir === "asc" ? "↑" : "↓"}
      </span>
    </Link>
  );
}
