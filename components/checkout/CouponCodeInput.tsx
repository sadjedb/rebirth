"use client";

import { useState, useTransition } from "react";
import { applyCoupon } from "@/app/(storefront)/checkout/actions";

export function CouponCodeInput({
  subtotal,
  applied,
  onApplied,
  onRemoved,
}: {
  subtotal: number;
  applied: { code: string; discountAmount: number } | null;
  onApplied: (code: string, discountAmount: number) => void;
  onRemoved: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    startTransition(async () => {
      // Preview only — createOrder recomputes and atomically redeems for
      // real at submission time. See the doc comment on applyCoupon.
      const result = await applyCoupon(trimmed, subtotal);
      if (result.valid) {
        onApplied(trimmed, result.discountAmount);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between text-sm py-2">
        <span className="text-sumi">
          Coupon <span className="font-mono">{applied.code}</span> applied
        </span>
        <button
          type="button"
          onClick={onRemoved}
          className="text-xs text-stone hover:text-sumi transition-colors underline"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-code-error" : undefined}
          className={`flex-1 border bg-transparent px-3 py-2.5 text-sm text-sumi outline-none transition-colors focus:border-sumi ${
            error ? "border-shu" : "border-stone/30"
          }`}
        />
        {/* type="button" — this sits inside CheckoutForm's <form>; it must
            never trigger that form's own submit. */}
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending}
          className="px-4 py-2.5 text-xs uppercase tracking-[0.12em] border border-stone/30 text-sumi hover:border-sumi transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-code-error" role="alert" className="text-xs text-shu mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
