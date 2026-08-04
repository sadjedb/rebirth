import { FormCard } from "@/components/admin/ui/FormCard";
import { formatMoney } from "@/lib/money";
import type { AdminOrderDetail } from "@/lib/orders/admin";

function SummaryRow({
  label,
  amount,
  currency,
  negative = false,
  emphasize = false,
}: {
  label: string;
  amount: number;
  currency: string;
  negative?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        emphasize ? "text-admin-fg font-medium" : "text-admin-muted"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">
        {negative && amount > 0 ? "−" : ""}
        {formatMoney(amount, currency)}
      </span>
    </div>
  );
}

export function SummaryCard({ order }: { order: AdminOrderDetail }) {
  return (
    <FormCard title="Summary">
      <div className="space-y-2">
        <SummaryRow label="Subtotal" amount={order.subtotal} currency={order.currency} />
        <SummaryRow
          label="Discount"
          amount={order.discountTotal}
          currency={order.currency}
          negative
        />
        <SummaryRow label="Shipping" amount={order.shippingTotal} currency={order.currency} />
        <SummaryRow label="Tax" amount={order.taxTotal} currency={order.currency} />
        <div className="border-t border-admin-border pt-2 mt-2">
          <SummaryRow label="Total" amount={order.total} currency={order.currency} emphasize />
        </div>
      </div>
    </FormCard>
  );
}
