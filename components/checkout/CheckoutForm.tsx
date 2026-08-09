"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { submitOrder } from "@/app/(storefront)/checkout/actions";
import { CouponCodeInput } from "@/components/checkout/CouponCodeInput";

const countries = [
  "United States",
  "United Kingdom",
  "France",
  "Germany",
  "United Arab Emirates",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Other",
];

const fields: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  span?: "full" | "half";
  required?: boolean;
}[] = [
  { name: "firstName", label: "First name", autoComplete: "given-name", span: "half" },
  { name: "lastName", label: "Last name", autoComplete: "family-name", span: "half" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", span: "full" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", span: "full" },
  { name: "addressLine1", label: "Address", autoComplete: "address-line1", span: "full" },
  {
    name: "addressLine2",
    label: "Apartment, suite, etc. (optional)",
    autoComplete: "address-line2",
    span: "full",
    required: false,
  },
  { name: "city", label: "City", autoComplete: "address-level2", span: "half" },
  { name: "region", label: "State / region", autoComplete: "address-level1", span: "half" },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", span: "half" },
];

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [values, setValues] = useState<Record<string, string>>({ country: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      // Only sent if the customer explicitly applied it above — never
      // silently attached from an unapplied, half-typed code. The amount
      // shown in the sidebar below is a preview only; createOrder
      // recomputes and atomically redeems for real, see
      // lib/coupons/redemption.ts.
      const result = await submitOrder(
        { ...values, couponCode: appliedCoupon?.code ?? "" },
        items
      );
      if (result.success) {
        clearCart();
        router.push(`/order-confirmation/${result.orderId}`);
        return;
      }
      setFieldErrors(result.fieldErrors);
      if (result.formError) setFormError(result.formError);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
      {fields.map((field) => (
        <div key={field.name} className={field.span === "full" ? "sm:col-span-2" : ""}>
          <label htmlFor={field.name} className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            required={field.required !== false}
            value={values[field.name] ?? ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            aria-invalid={Boolean(fieldErrors[field.name])}
            aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
            className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none transition-colors focus:border-sumi ${
              fieldErrors[field.name] ? "border-shu" : "border-stone/30"
            }`}
          />
          {fieldErrors[field.name] && (
            <p id={`${field.name}-error`} role="alert" className="text-xs text-shu mt-1.5">
              {fieldErrors[field.name]}
            </p>
          )}
        </div>
      ))}

      <div>
        <label htmlFor="country" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Country
        </label>
        <select
          id="country"
          name="country"
          required
          value={values.country ?? ""}
          onChange={(e) => handleChange("country", e.target.value)}
          aria-invalid={Boolean(fieldErrors.country)}
          aria-describedby={fieldErrors.country ? "country-error" : undefined}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none transition-colors focus:border-sumi ${
            fieldErrors.country ? "border-shu" : "border-stone/30"
          }`}
        >
          <option value="" disabled>
            Select a country
          </option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {fieldErrors.country && (
          <p id="country-error" role="alert" className="text-xs text-shu mt-1.5">
            {fieldErrors.country}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="notes" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Delivery notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={values.notes ?? ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="w-full border border-stone/30 bg-transparent px-3 py-3 text-sm text-sumi outline-none transition-colors focus:border-sumi resize-none"
        />
      </div>

      {formError && (
        <p role="alert" className="sm:col-span-2 text-sm text-shu">
          {formError}
        </p>
      )}

      <div className="sm:col-span-2 border-t border-stone/20 pt-6 mt-2">
        <CouponCodeInput
          subtotal={subtotal}
          applied={appliedCoupon}
          onApplied={(code, discountAmount) => setAppliedCoupon({ code, discountAmount })}
          onRemoved={() => setAppliedCoupon(null)}
        />

        {appliedCoupon ? (
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-sm text-stone">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-stone">
              <span>Discount</span>
              <span className="font-mono">-${appliedCoupon.discountAmount}</span>
            </div>
            <div className="flex items-center justify-between text-base pt-1">
              <span className="text-sumi">Total (cash on delivery)</span>
              <span className="font-mono text-sumi">
                ${subtotal - appliedCoupon.discountAmount}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-base mb-6">
            <span className="text-sumi">Total (cash on delivery)</span>
            <span className="font-mono text-sumi">${subtotal}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="w-full bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Placing order…" : "Place order"}
        </button>
        <p className="text-xs text-stone mt-4 text-center">
          You&apos;ll pay in cash when your order is delivered. We&apos;ll call to confirm before dispatch.
        </p>
      </div>
    </form>
  );
}
