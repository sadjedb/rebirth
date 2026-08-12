"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";

export function InventoryFilters({
  colorOptions,
  sizeOptions,
}: {
  colorOptions: string[];
  sizeOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentColor = searchParams.get("color") ?? "";
  const currentSize = searchParams.get("size") ?? "";
  const currentActive = searchParams.get("active") ?? "";
  const currentTracking = searchParams.get("tracking") ?? "";
  const currentStock = searchParams.get("stock") ?? "";

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildListUrl(pathname, searchParams, updates));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentColor}
        onChange={(e) => navigate({ color: e.target.value || undefined })}
        aria-label="Filter by color"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All colors</option>
        {colorOptions.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <select
        value={currentSize}
        onChange={(e) => navigate({ size: e.target.value || undefined })}
        aria-label="Filter by size"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All sizes</option>
        {sizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <select
        value={currentStock}
        onChange={(e) => navigate({ stock: e.target.value || undefined })}
        aria-label="Filter by stock level"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">Any stock level</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>

      <select
        value={currentTracking}
        onChange={(e) => navigate({ tracking: e.target.value || undefined })}
        aria-label="Filter by inventory tracking"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">Tracked & untracked</option>
        <option value="tracked">Tracked</option>
        <option value="untracked">Untracked</option>
      </select>

      <select
        value={currentActive}
        onChange={(e) => navigate({ active: e.target.value || undefined })}
        aria-label="Filter by active state"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">Active & inactive</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
