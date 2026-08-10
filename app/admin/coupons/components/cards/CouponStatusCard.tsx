"use client";

import type { Dispatch } from "react";
import { FormCard } from "@/components/admin/ui/FormCard";
import { DetailField } from "@/components/admin/ui/DetailField";
import { getAllowedCouponStatusTransitions, COUPON_STATUS_META } from "@/lib/coupons/status";
import type { CouponFormState } from "@/app/admin/coupons/components/coupon-form-state";
import type { CouponFormAction } from "@/app/admin/coupons/components/useCouponForm";
import type { CouponStatus } from "@prisma/client";

export function CouponStatusCard({
  state,
  dispatch,
  currentStatus = null,
  usageInfo = null,
  disabled = false,
}: {
  state: CouponFormState;
  dispatch: Dispatch<CouponFormAction>;
  /** The status this coupon currently has in the database — null when
   *  creating (any status is a valid starting point), mirrors
   *  PublishingCard's currentStatus prop exactly. */
  currentStatus?: CouponStatus | null;
  /** Read-only — usageCount is never an editable field. Null in create
   *  mode (a coupon that doesn't exist yet has no usage history). */
  usageInfo?: { usageCount: number; usageLimit: number | null; createdAt: Date; updatedAt: Date } | null;
  disabled?: boolean;
}) {
  const selectableStatuses = getAllowedCouponStatusTransitions(currentStatus);

  return (
    <FormCard title="Status">
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="sr-only">Status</legend>
        {selectableStatuses.map((status) => {
          const meta = COUPON_STATUS_META[status];
          return (
            <label
              key={status}
              className={`flex items-start gap-2.5 p-2.5 rounded-md border transition-colors ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-admin-surface-hover"
              } ${
                state.status === status
                  ? "border-admin-accent bg-admin-accent/5"
                  : "border-admin-border"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={state.status === status}
                onChange={() => dispatch({ type: "SET", field: "status", value: status })}
                className="mt-0.5 accent-admin-accent"
              />
              <span>
                <span className="block text-sm text-admin-fg font-medium">{meta.label}</span>
                <span className="block text-xs text-admin-muted">{meta.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {usageInfo && (
        <div className="pt-2 mt-2 border-t border-admin-border space-y-0">
          <DetailField label="Usage">
            {usageInfo.usageCount}
            {usageInfo.usageLimit !== null ? ` / ${usageInfo.usageLimit}` : " (unlimited)"}
          </DetailField>
          <DetailField label="Created">
            {usageInfo.createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </DetailField>
          <DetailField label="Last updated">
            {usageInfo.updatedAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </DetailField>
        </div>
      )}
    </FormCard>
  );
}
