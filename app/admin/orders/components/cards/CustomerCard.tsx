import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminOrderDetail } from "@/lib/orders/admin";

const PLACED_BY_LABELS: Record<AdminOrderDetail["placedBy"], string> = {
  CUSTOMER: "Customer (checkout)",
  ADMIN: "Admin (manual order)",
};

export function CustomerCard({ order }: { order: AdminOrderDetail }) {
  return (
    <FormCard title="Customer">
      <DetailField label="Name">
        {order.firstName} {order.lastName}
      </DetailField>

      <DetailField label="Email">
        <a href={`mailto:${order.email}`} className="text-admin-accent hover:underline">
          {order.email}
        </a>
      </DetailField>

      <DetailField label="Phone">
        <a href={`tel:${order.phone}`} className="text-admin-accent hover:underline">
          {order.phone}
        </a>
      </DetailField>

      <DetailField label="Account">
        {order.userId ? (
          <div className="flex items-center gap-2">
            <Badge variant="accent">Registered</Badge>
            {/* /admin/customers/[id] doesn't exist yet (Customers is a
                future module) — the nav already declares /admin/customers
                as the intended route, so this follows that established
                convention rather than inventing a new one. */}
            <Link href={`/admin/customers/${order.userId}`} className="text-admin-accent hover:underline">
              View customer
            </Link>
          </div>
        ) : (
          <Badge variant="neutral">Guest checkout</Badge>
        )}
      </DetailField>

      <DetailField label="Placed by">{PLACED_BY_LABELS[order.placedBy]}</DetailField>
    </FormCard>
  );
}
