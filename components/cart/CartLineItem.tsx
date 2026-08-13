"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart-context";
import { iconPaths } from "@/lib/product-icons";

export function CartLineItem({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-5 border-b border-stone/15">
      <Link
        href={`/product/${item.slug}`}
        className="relative w-20 aspect-[4/5] shrink-0 overflow-hidden"
        style={{ backgroundColor: item.tone }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full p-4 text-kachi/25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d={iconPaths[item.icon]} />
        </svg>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${item.slug}`}
              className="text-sm text-sumi hover:underline"
            >
              {item.name}
            </Link>
            <p className="font-mono text-[11px] text-stone mt-1">
              {item.code}
              {(item.color || item.size) && " · "}
              {[item.color, item.size ? `Size ${item.size}` : null].filter(Boolean).join(" / ")}
            </p>
          </div>
          <p className="font-mono text-sm text-sumi shrink-0">
            ${item.price * item.quantity}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-stone/30">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => setQuantity(item.variantId, item.quantity - 1)}
              className="w-8 h-8 text-sumi hover:bg-bone/50 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-mono" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => setQuantity(item.variantId, item.quantity + 1)}
              className="w-8 h-8 text-sumi hover:bg-bone/50 transition-colors"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.variantId)}
            className="text-xs text-stone underline hover:text-shu transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
