import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { OrderStatusBadge } from "@/app/admin/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/app/admin/orders/components/PaymentStatusBadge";
import { FulfillmentStatusBadge } from "@/app/admin/orders/components/FulfillmentStatusBadge";
import { formatMoney } from "@/lib/money";
import { formatOrderNumber, formatOrderTimestamp } from "@/lib/orders/format";
import type { CustomerDetailOrder } from "@/lib/customers/detail";

function OrderRow({ order }: { order: CustomerDetailOrder }) {
  return (
    <tr className="border-b border-admin-border last:border-b-0">
      <td className="py-3 pr-4 align-middle text-admin-fg font-mono">
        {formatOrderNumber(order.orderNumber)}
      </td>
      <td className="py-3 pr-4 align-middle text-admin-muted">
        {formatOrderTimestamp(order.createdAt)}
      </td>
      <td className="py-3 pr-4 align-middle">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="py-3 pr-4 align-middle">
        <PaymentStatusBadge status={order.paymentStatus} />
      </td>
      <td className="py-3 pr-4 align-middle">
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
      </td>
      <td className="py-3 pr-4 align-middle text-admin-fg text-right">
        {formatMoney(order.total, order.currency)}
      </td>
      <td className="py-3 align-middle text-right">
        <Link href={`/admin/orders/${order.id}`} className="text-admin-accent hover:underline">
          View
        </Link>
      </td>
    </tr>
  );
}

export function RecentOrdersCard({
  orders,
  hasMoreOrders,
  customerEmail,
}: {
  orders: CustomerDetailOrder[];
  hasMoreOrders: boolean;
  customerEmail: string;
}) {
  return (
    <FormCard
      title="Recent orders"
      description={
        orders.length > 0
          ? hasMoreOrders
            ? `${orders.length} most recent orders`
            : `${orders.length} order${orders.length === 1 ? "" : "s"}`
          : undefined
      }
    >
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders this customer places will show up here."
        />
      ) : (
        <>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-admin-muted border-b border-admin-border">
                  <th className="pb-2 pr-4 font-normal">Order</th>
                  <th className="pb-2 pr-4 font-normal">Date</th>
                  <th className="pb-2 pr-4 font-normal">Status</th>
                  <th className="pb-2 pr-4 font-normal">Payment</th>
                  <th className="pb-2 pr-4 font-normal">Fulfillment</th>
                  <th className="pb-2 pr-4 font-normal text-right">Total</th>
                  <th className="pb-2 font-normal text-right"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
          {orders.length > 0 && (
            <div className="pt-4">
              <Link
                href={`/admin/orders?search=${encodeURIComponent(customerEmail)}`}
                className="text-sm text-admin-accent hover:underline"
              >
                View all orders →
              </Link>
            </div>
          )}
        </>
      )}
    </FormCard>
  );
}
