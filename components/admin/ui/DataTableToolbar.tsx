"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";
import { BulkActionBar, type BulkAction } from "@/components/admin/ui/BulkActionBar";

const SEARCH_DEBOUNCE_MS = 400;

export function DataTableToolbar({
  searchPlaceholder = "Search…",
  filters,
  selectedIds,
  bulkActions,
}: {
  searchPlaceholder?: string;
  filters?: ReactNode;
  selectedIds: string[];
  bulkActions?: BulkAction[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");

  // Debounced navigation on typing — the URL (and therefore the server
  // query) is the source of truth, this just avoids a navigation per
  // keystroke. Adjusting state during render (comparing against the URL's
  // current value) rather than an effect would fight the debounce timer,
  // so this one genuinely needs to be effect-driven.
  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (searchValue === current) return;

    const timeout = window.setTimeout(() => {
      router.push(buildListUrl(pathname, searchParams, { search: searchValue || undefined }));
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on searchValue changes; re-including router/pathname/searchParams would fire on every navigation, defeating the debounce.
  }, [searchValue]);

  if (selectedIds.length > 0 && bulkActions && bulkActions.length > 0) {
    return <BulkActionBar selectedIds={selectedIds} actions={bulkActions} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-admin-border">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-admin-muted" />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg outline-none focus:border-admin-accent transition-colors"
        />
      </div>
      {filters}
    </div>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
