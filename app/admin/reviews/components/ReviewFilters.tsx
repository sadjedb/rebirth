"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";
import { REVIEW_STATUSES, REVIEW_STATUS_META } from "@/lib/reviews/status";

export function ReviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildListUrl(pathname, searchParams, updates));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => navigate({ status: e.target.value || undefined })}
        aria-label="Filter by review status"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All statuses</option>
        {REVIEW_STATUSES.map((status) => (
          <option key={status} value={status}>
            {REVIEW_STATUS_META[status].label}
          </option>
        ))}
      </select>
    </div>
  );
}
