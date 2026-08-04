import { Badge } from "@/components/admin/ui/Badge";
import { PAYMENT_STATUS_BADGE_VARIANT, PAYMENT_STATUS_META } from "@/lib/orders/status";
import type { PaymentStatus } from "@prisma/client";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT_STATUS_BADGE_VARIANT[status]}>{PAYMENT_STATUS_META[status].label}</Badge>
  );
}
