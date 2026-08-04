import type { Product } from "@/lib/products/storefront";

const shippingCopy = [
  "Cash on delivery — no payment required until your order arrives.",
  "Dispatched within 2 business days. Delivery in 3–7 days depending on location.",
  "Unworn items may be returned within 14 days of delivery for a refund.",
];

export function DetailsAccordion({ product }: { product: Product }) {
  return (
    <div className="mt-10 border-t border-stone/20">
      <details className="group border-b border-stone/20 py-4" open>
        <summary className="flex items-center justify-between cursor-pointer list-none text-sm text-sumi">
          Materials &amp; fit
          <span className="text-stone group-open:rotate-45 transition-transform">+</span>
        </summary>
        <ul className="mt-3 space-y-2 text-sm text-stone">
          {product.details.map((d: string) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </details>

      <details className="group border-b border-stone/20 py-4">
        <summary className="flex items-center justify-between cursor-pointer list-none text-sm text-sumi">
          Shipping &amp; returns
          <span className="text-stone group-open:rotate-45 transition-transform">+</span>
        </summary>
        <ul className="mt-3 space-y-2 text-sm text-stone">
          {shippingCopy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <a
          href="/shipping-returns"
          className="inline-block mt-3 text-xs text-sumi underline hover:no-underline"
        >
          Full policy
        </a>
      </details>
    </div>
  );
}
