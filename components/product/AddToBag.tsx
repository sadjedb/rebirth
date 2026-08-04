"use client";

import { useState } from "react";
import type { Product } from "@/lib/products/storefront";
import { isProductAvailable } from "@/lib/products/availability";
import { useCart } from "@/lib/cart-context";

export function AddToBag({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, openDrawer } = useCart();

  function handleAdd() {
    if (!size) {
      setError(true);
      return;
    }
    setError(false);
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      code: product.code,
      price: product.price,
      tone: product.tone ?? "#E4E0D6",
      icon: product.icon ?? "tee",
      size,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
    openDrawer();
  }

  if (!isProductAvailable(product)) {
    return (
      <div className="mt-8">
        <button
          type="button"
          disabled
          className="w-full border border-stone/30 text-stone py-4 text-[13px] uppercase tracking-[0.14em] cursor-not-allowed"
        >
          Sold out
        </button>
        <p className="text-xs text-stone mt-3">
          Sign up for restock alerts in the newsletter below.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <fieldset>
        <div className="flex items-center justify-between mb-3">
          <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone">
            Size
          </legend>
          <a href="/size-guide" className="text-xs text-stone underline hover:text-sumi transition-colors">
            Size guide
          </a>
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
          {product.sizes.map((s: string) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => {
                setSize(s);
                setError(false);
              }}
              className={`min-w-11 h-11 px-3 text-sm border transition-colors ${
                size === s
                  ? "border-sumi bg-sumi text-washi"
                  : "border-stone/30 text-sumi hover:border-sumi"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-xs text-shu mt-2">
            Select a size to continue.
          </p>
        )}
      </fieldset>

      <button
        type="button"
        onClick={handleAdd}
        className="w-full mt-6 bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors"
      >
        {added ? "Added to bag" : "Add to bag"}
      </button>

      <p className="text-xs text-stone mt-4 text-center">
        Cash on delivery — pay when your order arrives.
      </p>
    </div>
  );
}
