import { Badge } from "@/components/admin/ui/Badge";
import { PRODUCT_STATUS_BADGE_VARIANT, PRODUCT_STATUS_META } from "@/lib/products/status";
import type { ProductStatus } from "@prisma/client";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={PRODUCT_STATUS_BADGE_VARIANT[status]}>
      {PRODUCT_STATUS_META[status].label}
    </Badge>
  );
}
