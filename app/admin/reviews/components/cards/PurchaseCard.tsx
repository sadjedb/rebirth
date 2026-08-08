import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { formatOrderNumber, formatOrderTimestamp } from "@/lib/orders/format";
import type { ReviewDetail } from "@/lib/reviews/detail";

export function PurchaseCard({ review }: { review: ReviewDetail }) {
  return (
    <FormCard title="Product & purchase">
      <DetailField label="Product">
        <Link
          href={`/admin/products/${review.product.id}`}
          className="text-admin-accent hover:underline"
        >
          {review.product.name}
        </Link>
      </DetailField>
      <DetailField label="Purchased as">
        {/* OrderItem's own snapshot at time of purchase (name/size) — may
            differ from the live product above if it's since been edited. */}
        {review.purchase.name} · Size {review.purchase.size} · Qty{" "}
        {review.purchase.quantity}
      </DetailField>
      <DetailField label="Order">
        <Link
          href={`/admin/orders/${review.purchase.orderId}`}
          className="text-admin-accent hover:underline"
        >
          {formatOrderNumber(review.purchase.orderNumber)}
        </Link>
      </DetailField>
      <DetailField label="Order completed">
        {formatOrderTimestamp(review.purchase.completedAt)}
      </DetailField>
    </FormCard>
  );
}
