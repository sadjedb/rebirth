import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getAdminOrder } from "@/lib/orders/admin";
import { getOrderTimeline } from "@/lib/orders/timeline";
import { formatOrderNumber } from "@/lib/orders/format";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { CustomerCard } from "@/app/admin/orders/components/cards/CustomerCard";
import { AddressCard } from "@/app/admin/orders/components/cards/AddressCard";
import { ItemsCard } from "@/app/admin/orders/components/cards/ItemsCard";
import { NotesCard } from "@/app/admin/orders/components/cards/NotesCard";
import { PaymentCard } from "@/app/admin/orders/components/cards/PaymentCard";
import { FulfillmentCard } from "@/app/admin/orders/components/cards/FulfillmentCard";
import { SummaryCard } from "@/app/admin/orders/components/cards/SummaryCard";
import { StatusCard } from "@/app/admin/orders/components/cards/StatusCard";
import { CustomerServiceCard } from "@/app/admin/orders/components/cards/CustomerServiceCard";
import { MetadataCard } from "@/app/admin/orders/components/cards/MetadataCard";
import { OrderTimeline } from "@/app/admin/orders/components/OrderTimeline";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Order — ${brand.name} Admin`,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageAccess("orders:view");

  const { id } = await params;
  const [order, timeline] = await Promise.all([getAdminOrder(id), getOrderTimeline(id)]);

  if (!order) notFound();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: formatOrderNumber(order.orderNumber) },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <h1 className="text-2xl font-semibold text-admin-fg">
          Order {formatOrderNumber(order.orderNumber)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CustomerCard order={order} />
          <AddressCard shippingAddress={order.shippingAddress} billingAddress={order.billingAddress} />
          <ItemsCard order={order} />
          <NotesCard orderId={order.id} entries={timeline} canEdit={can(user.role, "orders:edit")} />
        </div>

        <div className="space-y-6">
          <StatusCard
            order={order}
            canEdit={can(user.role, "orders:edit")}
            canCancel={can(user.role, "orders:cancel")}
          />
          <CustomerServiceCard order={order} canEdit={can(user.role, "orders:edit")} />
          <SummaryCard order={order} />
          <PaymentCard order={order} />
          <FulfillmentCard order={order} />
          <MetadataCard order={order} />
        </div>
      </div>

      <div className="mt-6">
        <OrderTimeline entries={timeline} />
      </div>
    </div>
  );
}
