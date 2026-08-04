import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { formatOrderNumber, formatOrderTimestamp } from "@/lib/orders/format";
import type { AdminOrderDetail } from "@/lib/orders/admin";

const PLACED_BY_LABELS: Record<AdminOrderDetail["placedBy"], string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
};

export function MetadataCard({ order }: { order: AdminOrderDetail }) {
  return (
    <FormCard title="Metadata">
      <DetailField label="Order number">{formatOrderNumber(order.orderNumber)}</DetailField>
      <DetailField label="Internal ID">
        <span className="font-mono text-xs text-admin-muted break-all">{order.id}</span>
      </DetailField>
      <DetailField label="Currency">{order.currency}</DetailField>
      <DetailField label="Placed by">{PLACED_BY_LABELS[order.placedBy]}</DetailField>
      <DetailField label="Created">{formatOrderTimestamp(order.createdAt)}</DetailField>
      <DetailField label="Updated">{formatOrderTimestamp(order.updatedAt)}</DetailField>
      <DetailField label="Paid at">{formatOrderTimestamp(order.paidAt)}</DetailField>
      <DetailField label="Completed at">{formatOrderTimestamp(order.completedAt)}</DetailField>
      <DetailField label="Cancelled at">{formatOrderTimestamp(order.cancelledAt)}</DetailField>
    </FormCard>
  );
}
