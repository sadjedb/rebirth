"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildListUrl } from "@/lib/admin/url-state";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_META,
  FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_META,
} from "@/lib/orders/status";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";
  const currentPaymentStatus = searchParams.get("paymentStatus") ?? "";
  const currentFulfillmentStatus = searchParams.get("fulfillmentStatus") ?? "";

  function navigate(updates: Record<string, string | undefined>) {
    router.push(buildListUrl(pathname, searchParams, updates));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => navigate({ status: e.target.value || undefined })}
        aria-label="Filter by order status"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_META[status].label}
          </option>
        ))}
      </select>

      <select
        value={currentPaymentStatus}
        onChange={(e) => navigate({ paymentStatus: e.target.value || undefined })}
        aria-label="Filter by payment status"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All payments</option>
        {PAYMENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PAYMENT_STATUS_META[status].label}
          </option>
        ))}
      </select>

      <select
        value={currentFulfillmentStatus}
        onChange={(e) => navigate({ fulfillmentStatus: e.target.value || undefined })}
        aria-label="Filter by fulfillment status"
        className="text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent"
      >
        <option value="">All fulfillment</option>
        {FULFILLMENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {FULFILLMENT_STATUS_META[status].label}
          </option>
        ))}
      </select>
    </div>
  );
}
