import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { formatMoney } from "@/lib/money";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { CustomerDetail } from "@/lib/customers/detail";

export function StatisticsCard({ customer }: { customer: CustomerDetail }) {
  return (
    <FormCard title="Statistics">
      <DetailField label="Orders">{customer.orderCount}</DetailField>
      <DetailField label="Total spent">{formatMoney(customer.totalSpent)}</DetailField>
      <DetailField label="Average order">{formatMoney(customer.averageOrderValue)}</DetailField>
      <DetailField label="First order">{formatOrderTimestamp(customer.firstOrderAt)}</DetailField>
      <DetailField label="Last order">{formatOrderTimestamp(customer.lastOrderAt)}</DetailField>
    </FormCard>
  );
}
