import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { PaymentStatusBadge } from "@/app/admin/orders/components/PaymentStatusBadge";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders/status";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { AdminOrderDetail } from "@/lib/orders/admin";

export function PaymentCard({ order }: { order: AdminOrderDetail }) {
  return (
    <FormCard title="Payment">
      <DetailField label="Status">
        <PaymentStatusBadge status={order.paymentStatus} />
      </DetailField>

      <DetailField label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</DetailField>

      <DetailField label="Paid">{formatOrderTimestamp(order.paidAt)}</DetailField>
    </FormCard>
  );
}
