import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/auth";
import { getCustomerDetail } from "@/lib/customers/detail";
import { formatMoney } from "@/lib/money";
import { formatOrderTimestamp } from "@/lib/orders/format";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { StatisticsCard } from "@/app/admin/customers/components/cards/StatisticsCard";
import { RecentOrdersCard } from "@/app/admin/customers/components/cards/RecentOrdersCard";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Customer — ${brand.name} Admin`,
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("customers:view");

  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) notFound();

  const name = `${customer.firstName} ${customer.lastName}`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: name },
        ]}
      />

      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold text-admin-fg">{name}</h1>
        <p className="text-sm text-admin-muted mt-1">
          {customer.email} · Customer since {formatOrderTimestamp(customer.createdAt)} ·{" "}
          {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"} ·{" "}
          {formatMoney(customer.totalSpent)} total spent
        </p>
      </div>

      <div className="space-y-6">
        <StatisticsCard customer={customer} />
        <RecentOrdersCard
          orders={customer.recentOrders}
          hasMoreOrders={customer.hasMoreOrders}
          customerEmail={customer.email}
        />
      </div>
    </div>
  );
}
