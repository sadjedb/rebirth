import { Badge } from "@/components/admin/ui/Badge";
import { REVIEW_STATUS_META, REVIEW_STATUS_BADGE_VARIANT } from "@/lib/reviews/status";
import type { ReviewStatus } from "@prisma/client";

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={REVIEW_STATUS_BADGE_VARIANT[status]}>{REVIEW_STATUS_META[status].label}</Badge>;
}
