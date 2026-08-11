import { FormCard } from "@/components/admin/ui/FormCard";
import { formatOrderTimestamp } from "@/lib/orders/format";
import type { CouponTimelineEntry } from "@/lib/coupons/timeline";

export function CouponTimeline({ entries }: { entries: CouponTimelineEntry[] }) {
  return (
    <FormCard title="Timeline">
      {entries.length === 0 ? (
        <p className="text-sm text-admin-muted">No activity yet.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <div
                className="mt-1.5 h-1.5 w-1.5 rounded-full bg-admin-accent shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-admin-fg">{entry.title}</p>
                {entry.description && (
                  <p className="text-sm text-admin-muted mt-0.5 whitespace-pre-wrap break-words">
                    {entry.description}
                  </p>
                )}
                <p className="text-xs text-admin-muted mt-1">
                  {entry.actorLabel} · {formatOrderTimestamp(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </FormCard>
  );
}
