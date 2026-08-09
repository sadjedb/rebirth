import { Badge } from "@/components/admin/ui/Badge";
import {
  COUPON_EFFECTIVE_STATE_META,
  COUPON_EFFECTIVE_STATE_BADGE_VARIANT,
  type CouponEffectiveState,
} from "@/lib/coupons/status";

export function CouponEffectiveStateBadge({ state }: { state: CouponEffectiveState }) {
  return (
    <Badge variant={COUPON_EFFECTIVE_STATE_BADGE_VARIANT[state]}>
      {COUPON_EFFECTIVE_STATE_META[state].label}
    </Badge>
  );
}
