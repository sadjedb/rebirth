import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getAdminOrders } from "@/lib/orders/admin";
import { ORDER_STATUSES, PAYMENT_STATUSES, FULFILLMENT_STATUSES } from "@/lib/orders/status";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { OrderTable } from "@/app/admin/orders/components/OrderTable";
import { OrderFilters } from "@/app/admin/orders/components/OrderFilters";
import { brand } from "@/config/brand";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Orders — ${brand.name} Admin`,
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requirePageAccess("orders:view");

  const params = await searchParams;
  const status = ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const paymentStatus = PAYMENT_STATUSES.includes(params.paymentStatus as PaymentStatus)
    ? (params.paymentStatus as PaymentStatus)
    : undefined;
  const fulfillmentStatus = FULFILLMENT_STATUSES.includes(
    params.fulfillmentStatus as FulfillmentStatus
  )
    ? (params.fulfillmentStatus as FulfillmentStatus)
    : undefined;

  const { items, total, pageCount, page, pageSize } = await getAdminOrders({
    search: params.search,
    status,
    paymentStatus,
    fulfillmentStatus,
    sort: params.sort,
    dir: params.dir === "asc" ? "asc" : "desc",
    page: params.page ? Number(params.page) : 1,
  });

  const hasActiveFilters = Boolean(
    params.search || params.status || params.paymentStatus || params.fulfillmentStatus
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
        ]}
      />

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-admin-fg">Orders</h1>
          <p className="text-sm text-admin-muted mt-1">
            {total} order{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <OrderTable
        orders={items}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={total}
        hasActiveFilters={hasActiveFilters}
        filters={<OrderFilters />}
        canEdit={can(user.role, "orders:edit")}
        canCancel={can(user.role, "orders:cancel")}
      />
    </div>
  );
}
