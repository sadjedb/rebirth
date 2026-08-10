import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { formatMoney } from "@/lib/money";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { CouponDetail } from "@/lib/coupons/detail";

export function UsageStatsCard({ coupon }: { coupon: CouponDetail }) {
  const remaining = coupon.usageLimit === null ? null : Math.max(coupon.usageLimit - coupon.usageCount, 0);
  // Coupon.usageCount is authoritative (it's what's actually checked at
  // redemption time — see lib/coupons/redemption.ts). orderCount is a
  // cross-check derived from Order rows, shown only for visibility; if
  // they ever differ this never triggers a "repair" of either value.
  const countMismatch = coupon.usageStats.orderCount !== coupon.usageCount;

  return (
    <FormCard title="Usage">
      <DetailField label="Redemptions">
        {coupon.usageCount}
        {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : " (unlimited)"}
      </DetailField>
      {coupon.usageLimit !== null && <DetailField label="Remaining">{remaining}</DetailField>}
      <DetailField label="Total discount granted">
        {formatMoney(coupon.usageStats.totalDiscountGranted)}
      </DetailField>
      <DetailField label="Most recent redemption">
        {coupon.usageStats.mostRecentRedemptionAt
          ? formatOrderTimestamp(coupon.usageStats.mostRecentRedemptionAt)
          : "—"}
      </DetailField>

      {countMismatch && (
        <p className="text-xs text-admin-muted pt-3 mt-1 border-t border-admin-border">
          {coupon.usageStats.orderCount} order{coupon.usageStats.orderCount === 1 ? "" : "s"} currently
          reference this coupon, which differs from the usage count above. The count above is what&apos;s
          actually enforced at checkout.
        </p>
      )}
    </FormCard>
  );
}
