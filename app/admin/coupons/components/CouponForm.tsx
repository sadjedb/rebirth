"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useCouponForm } from "@/app/admin/coupons/components/useCouponForm";
import { emptyCouponForm, type CouponFormState } from "@/app/admin/coupons/components/coupon-form-state";
import { createCoupon } from "@/app/admin/coupons/actions";
import { updateCoupon } from "@/app/admin/coupons/[id]/actions";
import { CouponDetailsCard } from "@/app/admin/coupons/components/cards/CouponDetailsCard";
import { CouponRulesCard } from "@/app/admin/coupons/components/cards/CouponRulesCard";
import { CouponStatusCard } from "@/app/admin/coupons/components/cards/CouponStatusCard";
import type { CouponStatus } from "@prisma/client";

type CouponFormProps = {
  usageInfo?: { usageCount: number; usageLimit: number | null; createdAt: Date; updatedAt: Date };
} & ({ mode: "create" } | { mode: "edit"; couponId: string; initialFormState: CouponFormState });

export function CouponForm(props: CouponFormProps) {
  const { mode, usageInfo } = props;
  const router = useRouter();
  const toast = useToast();

  const baseline = mode === "edit" ? props.initialFormState : emptyCouponForm;
  const currentStatus: CouponStatus | null = mode === "edit" ? props.initialFormState.status : null;

  const [state, dispatch] = useCouponForm(baseline);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const isDirty = JSON.stringify(state) !== JSON.stringify(baseline);

  useEffect(() => {
    if (!isDirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleCancel() {
    if (isDirty) {
      setConfirmingDiscard(true);
    } else {
      router.push("/admin/coupons");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setConflict(false);

    const payload = {
      code: state.code,
      description: state.description,
      discountType: state.discountType,
      discountValue: state.discountValue,
      minOrderValue: state.minOrderValue,
      usageLimit: state.usageLimit,
      startsAt: state.startsAt,
      endsAt: state.endsAt,
      status: state.status,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCoupon(payload)
          : await updateCoupon(props.couponId, state.updatedAt, payload);

      if (result.success) {
        toast({ variant: "success", title: mode === "edit" ? "Coupon updated" : "Coupon created" });
        router.push("/admin/coupons");
        return;
      }

      if (result.fieldErrors) setErrors(result.fieldErrors);
      if (result.formError) setFormError(result.formError);
      if ("conflict" in result && result.conflict) setConflict(true);
      toast({ variant: "error", title: "Couldn't save coupon", description: result.formError });
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CouponDetailsCard state={state} dispatch={dispatch} errors={errors} />
          <CouponRulesCard state={state} dispatch={dispatch} errors={errors} />
        </div>

        <div className="space-y-6">
          <CouponStatusCard
            state={state}
            dispatch={dispatch}
            currentStatus={currentStatus}
            usageInfo={usageInfo}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 border-t border-admin-border bg-admin-bg/95 backdrop-blur-sm flex items-center justify-between">
        <div>
          {formError && (
            <p role="alert" className="text-sm text-admin-danger">
              {formError}
              {conflict && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-2 underline hover:no-underline"
                >
                  Reload page
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-md border border-admin-border text-admin-fg hover:bg-admin-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving…" : mode === "edit" ? "Save" : "Create coupon"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDiscard}
        title="Discard unsaved changes?"
        description="Your changes haven't been saved. This can't be undone."
        confirmLabel="Discard"
        variant="danger"
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => {
          setConfirmingDiscard(false);
          router.push("/admin/coupons");
        }}
      />
    </form>
  );
}
