"use client";

import { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/(storefront)/account/reviews/actions";

export function ReviewSubmitForm({
  orderItemId,
  productName,
  onSubmitted,
}: {
  orderItemId: string;
  productName: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await submitReviewAction({
        orderItemId,
        rating: String(rating),
        body,
      });
      if (result.success) {
        onSubmitted();
      } else {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-stone/20 p-6 mt-3 space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Rating
        </label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border border-stone/30 bg-transparent px-3 py-2 text-sm text-sumi outline-none focus:border-sumi"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`review-body-${orderItemId}`} className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Your review of {productName}
        </label>
        <textarea
          id={`review-body-${orderItemId}`}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={Boolean(fieldErrors.body)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi resize-none ${
            fieldErrors.body ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.body && <p className="text-xs text-shu mt-1.5">{fieldErrors.body}</p>}
      </div>

      {formError && !fieldErrors.body && !fieldErrors.rating && (
        <p className="text-xs text-shu">{formError}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-sumi text-washi px-6 py-3 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
