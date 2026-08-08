"use client";

import { useState } from "react";
import { ReviewSubmitForm } from "@/app/(storefront)/account/reviews/ReviewSubmitForm";
import type { EligibleReviewItem } from "@/lib/reviews/eligibility";

export function EligibleReviewsSection({ items }: { items: EligibleReviewItem[] }) {
  const [openOrderItemId, setOpenOrderItemId] = useState<string | null>(null);
  // Tracked client-side so a just-submitted item disappears immediately —
  // the server action already revalidates /account for future loads, this
  // just avoids waiting on a full refresh for the current view.
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const visible = items.filter((item) => !submittedIds.has(item.orderItemId));

  if (visible.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-6 border-b border-stone/20 pb-4">
        Products you can review
      </p>

      <div className="divide-y divide-stone/15">
        {visible.map((item) => (
          <div key={item.orderItemId} className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sumi">{item.name}</p>
                <p className="text-xs text-stone mt-1">
                  Purchased{" "}
                  {new Date(item.purchasedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setOpenOrderItemId((current) =>
                    current === item.orderItemId ? null : item.orderItemId
                  )
                }
                className="text-[13px] uppercase tracking-[0.14em] text-stone border border-stone/30 px-5 py-2.5 hover:border-sumi hover:text-sumi transition-colors"
              >
                {openOrderItemId === item.orderItemId ? "Cancel" : "Write a review"}
              </button>
            </div>

            {openOrderItemId === item.orderItemId && (
              <ReviewSubmitForm
                orderItemId={item.orderItemId}
                productName={item.name}
                onSubmitted={() => {
                  setSubmittedIds((prev) => new Set(prev).add(item.orderItemId));
                  setOpenOrderItemId(null);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
