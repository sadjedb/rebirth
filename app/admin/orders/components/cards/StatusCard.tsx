"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { useToast } from "@/components/admin/ui/Toast";
import { OrderStatusBadge } from "@/app/admin/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/app/admin/orders/components/PaymentStatusBadge";
import { FulfillmentStatusBadge } from "@/app/admin/orders/components/FulfillmentStatusBadge";
import {
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderFulfillmentStatus,
} from "@/app/admin/orders/[id]/actions";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  FULFILLMENT_STATUS_META,
  getAllowedOrderStatusTransitions,
  getAllowedPaymentStatusTransitions,
  getAllowedFulfillmentStatusTransitions,
} from "@/lib/orders/status";
import type { AdminOrderDetail } from "@/lib/orders/admin";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";

const SELECT_CLASSNAME =
  "w-full text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2.5 py-1.5 outline-none focus:border-admin-accent disabled:opacity-50 disabled:cursor-not-allowed";

export function StatusCard({
  order,
  canEdit,
  canCancel,
}: {
  order: AdminOrderDetail;
  canEdit: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function runMutation(label: string, mutate: () => ReturnType<typeof updateOrderStatus>) {
    startTransition(async () => {
      const result = await mutate();
      if (result.success) {
        toast({ variant: "success", title: label });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't update order", description: result.error });
      }
    });
  }

  const orderStatusOptions = getAllowedOrderStatusTransitions(order.status).filter(
    (status) => status !== "CANCELLED" || canCancel || status === order.status
  );

  return (
    <FormCard title="Status">
      <DetailField label="Order">
        {canEdit ? (
          <select
            value={order.status}
            disabled={isPending}
            onChange={(e) => {
              const to = e.target.value as OrderStatus;
              runMutation(`Order marked ${ORDER_STATUS_META[to].label.toLowerCase()}`, () =>
                updateOrderStatus(order.id, order.updatedAt.toISOString(), { to })
              );
            }}
            className={SELECT_CLASSNAME}
          >
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_META[status].label}
              </option>
            ))}
          </select>
        ) : (
          <OrderStatusBadge status={order.status} />
        )}
      </DetailField>

      <DetailField label="Payment">
        {canEdit ? (
          <select
            value={order.paymentStatus}
            disabled={isPending}
            onChange={(e) => {
              const to = e.target.value as PaymentStatus;
              runMutation(`Payment marked ${PAYMENT_STATUS_META[to].label.toLowerCase()}`, () =>
                updateOrderPaymentStatus(order.id, order.updatedAt.toISOString(), { to })
              );
            }}
            className={SELECT_CLASSNAME}
          >
            {getAllowedPaymentStatusTransitions(order.paymentStatus).map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_META[status].label}
              </option>
            ))}
          </select>
        ) : (
          <PaymentStatusBadge status={order.paymentStatus} />
        )}
      </DetailField>

      <DetailField label="Fulfillment">
        {canEdit ? (
          <select
            value={order.fulfillmentStatus}
            disabled={isPending}
            onChange={(e) => {
              const to = e.target.value as FulfillmentStatus;
              runMutation(
                `Fulfillment marked ${FULFILLMENT_STATUS_META[to].label.toLowerCase()}`,
                () => updateOrderFulfillmentStatus(order.id, order.updatedAt.toISOString(), { to })
              );
            }}
            className={SELECT_CLASSNAME}
          >
            {getAllowedFulfillmentStatusTransitions(order.fulfillmentStatus).map((status) => (
              <option key={status} value={status}>
                {FULFILLMENT_STATUS_META[status].label}
              </option>
            ))}
          </select>
        ) : (
          <FulfillmentStatusBadge status={order.fulfillmentStatus} />
        )}
      </DetailField>
    </FormCard>
  );
}
