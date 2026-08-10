import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { DataTablePagination } from "@/components/admin/ui/DataTablePagination";
import { OrderStatusBadge } from "@/app/admin/orders/components/OrderStatusBadge";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber, formatOrderTimestamp } from "@/lib/orders/format";
import type { CouponRedemption } from "@/lib/coupons/detail";

function RedemptionRow({ redemption }: { redemption: CouponRedemption }) {
  return (
    <tr className="border-b border-admin-border last:border-b-0">
      <td className="py-3 pr-4 align-middle text-admin-fg font-mono">
        <Link
          href={`/admin/orders/${redemption.id}`}
          className="hover:text-admin-accent transition-colors"
        >
          {formatOrderNumber(redemption.orderNumber)}
        </Link>
      </td>
      <td className="py-3 pr-4 align-middle text-admin-muted">
        {formatOrderTimestamp(redemption.createdAt)}
      </td>
      <td className="py-3 pr-4 align-middle">
        {redemption.customerId ? (
          <Link
            href={`/admin/customers/${redemption.customerId}`}
            className="text-admin-fg hover:text-admin-accent transition-colors"
          >
            {redemption.customerName}
          </Link>
        ) : (
          <span className="text-admin-fg">
            {redemption.customerName} <span className="text-admin-muted text-xs">(guest)</span>
          </span>
        )}
      </td>
      <td className="py-3 pr-4 align-middle">
        <OrderStatusBadge status={redemption.status} />
      </td>
      <td className="py-3 pr-4 align-middle text-admin-fg text-right">
        {formatMoney(redemption.subtotal)}
      </td>
      <td className="py-3 pr-4 align-middle text-admin-fg text-right">
        -{formatMoney(redemption.discountTotal)}
      </td>
      <td className="py-3 align-middle text-admin-fg text-right">{formatMoney(redemption.total)}</td>
    </tr>
  );
}

/** Real pagination (DataTablePagination, URL-driven via the page's own
 *  `?page=` param — this route has no other paginated element, so no
 *  collision), not a capped "recent N" list — unlike RecentOrdersCard,
 *  there's no existing Orders-list filter dimension to redirect to for
 *  "view all" (Orders has no couponId search), so the full history has
 *  to live here. No search/filter box: nothing in this list needs one
 *  beyond what the coupon itself already scopes it to. */
export function RedemptionsCard({
  redemptions,
  page,
  pageCount,
  pageSize,
  totalCount,
}: {
  redemptions: CouponRedemption[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
}) {
  return (
    <FormCard
      title="Redemptions"
      description={totalCount > 0 ? `${totalCount} order${totalCount === 1 ? "" : "s"}` : undefined}
    >
      {redemptions.length === 0 ? (
        <EmptyState
          title="No redemptions yet"
          description="Orders that use this coupon will show up here."
        />
      ) : (
        <>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-admin-muted border-b border-admin-border">
                  <th className="pb-2 pr-4 font-normal">Order</th>
                  <th className="pb-2 pr-4 font-normal">Date</th>
                  <th className="pb-2 pr-4 font-normal">Customer</th>
                  <th className="pb-2 pr-4 font-normal">Status</th>
                  <th className="pb-2 pr-4 font-normal text-right">Subtotal</th>
                  <th className="pb-2 pr-4 font-normal text-right">Discount</th>
                  <th className="pb-2 font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((redemption) => (
                  <RedemptionRow key={redemption.id} redemption={redemption} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="-mx-5 -mb-5">
            <DataTablePagination page={page} pageCount={pageCount} pageSize={pageSize} totalCount={totalCount} />
          </div>
        </>
      )}
    </FormCard>
  );
}
