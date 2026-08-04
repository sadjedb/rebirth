import { Badge } from "@/components/admin/ui/Badge";
import { ORDER_STATUS_BADGE_VARIANT, ORDER_STATUS_META } from "@/lib/orders/status";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_STATUS_BADGE_VARIANT[status]}>{ORDER_STATUS_META[status].label}</Badge>;
}
