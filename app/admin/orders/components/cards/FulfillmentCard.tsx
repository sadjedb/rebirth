import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { FulfillmentStatusBadge } from "@/app/admin/orders/components/FulfillmentStatusBadge";
import type { AdminOrderDetail } from "@/lib/orders/admin";

export function FulfillmentCard({ order }: { order: AdminOrderDetail }) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <FormCard title="Fulfillment">
      <DetailField label="Status">
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
      </DetailField>

      <DetailField label="Items">
        {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
      </DetailField>
    </FormCard>
  );
}
