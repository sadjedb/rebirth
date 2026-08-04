"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";
import { PRODUCT_STATUSES, PRODUCT_STATUS_META } from "@/lib/products/status";
import type { Category } from "@prisma/client";

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";
  const currentCategory = searchParams.get("categoryId") ?? "";

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildListUrl(pathname, searchParams, updates));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => navigate({ status: e.target.value || undefined })}
        aria-label="Filter by status"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All statuses</option>
        {PRODUCT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PRODUCT_STATUS_META[status].label}
          </option>
        ))}
      </select>

      <select
        value={currentCategory}
        onChange={(e) => navigate({ categoryId: e.target.value || undefined })}
        aria-label="Filter by category"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
