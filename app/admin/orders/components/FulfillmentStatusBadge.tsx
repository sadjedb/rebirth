import { Badge } from "@/components/admin/ui/Badge";
import { FULFILLMENT_STATUS_BADGE_VARIANT, FULFILLMENT_STATUS_META } from "@/lib/orders/status";
import type { FulfillmentStatus } from "@prisma/client";

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <Badge variant={FULFILLMENT_STATUS_BADGE_VARIANT[status]}>
      {FULFILLMENT_STATUS_META[status].label}
    </Badge>
  );
}
