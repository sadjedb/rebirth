"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products/storefront";
import { isProductAvailable, isVariantAvailable } from "@/lib/products/availability";
import { useCart } from "@/lib/cart-context";

type Variant = Product["variants"][number];

/**
 * Module 6 (Inventory), Phase 3. Replaces the old size-only picker with a
 * variant resolver: color (if the product has any), then size (if the
 * product has any, filtered to what's available under the selected
 * color), resolving to one exact ProductVariant before anything can be
 * added to the cart. A product with neither dimension (the single
 * default/legacy variant from the Phase 3 migration) skips both pickers
 * entirely and resolves straight to that one variant — no UI shown, same
 * as before Module 6 existed.
 *
 * The server is still never trusted with this resolution — see
 * lib/orders/storefront.ts's createOrder, which re-fetches and
 * re-validates the variant fresh at checkout regardless of what
 * variantId the cart carries.
 */
export function AddToBag({ product }: { product: Product }) {
  const hasColor = product.variants.some((v) => v.color);
  const hasSize = product.variants.some((v) => v.size);

  const colors = useMemo(
    () =>
      Array.from(
        new Set(product.variants.filter((v): v is Variant & { color: string } => v.color !== null).map((v) => v.color))
      ),
    [product.variants]
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem, openDrawer } = useCart();

  const sizesForSelectedColor = useMemo(() => {
    const pool = hasColor ? product.variants.filter((v) => v.color === selectedColor) : product.variants;
    return Array.from(
      new Set(pool.filter((v): v is Variant & { size: string } => v.size !== null).map((v) => v.size))
    );
  }, [product.variants, hasColor, selectedColor]);

  const resolvedVariant: Variant | undefined = useMemo(() => {
    if (hasColor && !selectedColor) return undefined;
    if (hasSize && !selectedSize) return undefined;
    return product.variants.find(
      (v) => (hasColor ? v.color === selectedColor : true) && (hasSize ? v.size === selectedSize : true)
    );
  }, [product.variants, hasColor, hasSize, selectedColor, selectedSize]);

  function handleAdd() {
    if (!resolvedVariant) {
      setError(hasColor && !selectedColor ? "Select a color to continue." : "Select a size to continue.");
      return;
    }
    if (!isVariantAvailable(resolvedVariant)) {
      setError("This option is currently out of stock.");
      return;
    }
    setError(null);
    addItem({
      productId: product.id,
      variantId: resolvedVariant.id,
      slug: product.slug,
      name: product.name,
      code: product.code,
      price: product.price,
      tone: product.tone ?? "#E4E0D6",
      icon: product.icon ?? "tee",
      size: resolvedVariant.size,
      color: resolvedVariant.color,
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
      {hasColor && (
        <fieldset className="mb-6">
          <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-3">
            Color
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select color">
            {colors.map((c) => {
              const colorAvailable = product.variants.some((v) => v.color === c && isVariantAvailable(v));
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={selectedColor === c}
                  disabled={!colorAvailable}
                  onClick={() => {
                    setSelectedColor(c);
                    setSelectedSize(null);
                    setError(null);
                  }}
                  className={`min-w-11 h-11 px-3 text-sm border transition-colors ${
                    selectedColor === c
                      ? "border-sumi bg-sumi text-washi"
                      : colorAvailable
                        ? "border-stone/30 text-sumi hover:border-sumi"
                        : "border-stone/15 text-stone/40 cursor-not-allowed line-through"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {hasSize && (
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
            {sizesForSelectedColor.map((s) => {
              const variant = product.variants.find(
                (v) => (hasColor ? v.color === selectedColor : true) && v.size === s
              );
              const sizeAvailable = variant ? isVariantAvailable(variant) : true;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selectedSize === s}
                  disabled={!sizeAvailable}
                  onClick={() => {
                    setSelectedSize(s);
                    setError(null);
                  }}
                  className={`min-w-11 h-11 px-3 text-sm border transition-colors ${
                    selectedSize === s
                      ? "border-sumi bg-sumi text-washi"
                      : sizeAvailable
                        ? "border-stone/30 text-sumi hover:border-sumi"
                        : "border-stone/15 text-stone/40 cursor-not-allowed line-through"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-xs text-shu mt-2">
          {error}
        </p>
      )}

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
