"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartLineItem } from "@/components/cart/CartLineItem";

export function CartDrawer() {
  const { items, subtotal, isDrawerOpen, closeDrawer } = useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on open, restore scroll on close — basic
  // focus management for a modal-like overlay.
  useEffect(() => {
    if (isDrawerOpen) {
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        aria-label="Close bag"
        onClick={closeDrawer}
        className="absolute inset-0 bg-kachi/40 backdrop-blur-[2px]"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-washi flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone/20">
          <h2 className="font-display italic text-2xl text-sumi">Bag</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close bag"
            className="text-sumi text-2xl leading-none hover:opacity-60 transition-opacity"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-display italic text-xl text-sumi mb-2">
              Your bag is empty.
            </p>
            <p className="text-sm text-stone mb-6">
              Nothing to carry yet — go find something worth keeping.
            </p>
            <Link
              href="/collection"
              onClick={closeDrawer}
              className="text-[13px] uppercase tracking-[0.14em] border border-sumi text-sumi px-5 py-2.5 hover:bg-sumi hover:text-washi transition-colors"
            >
              Browse collection
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartLineItem key={`${item.productId}::${item.size}`} item={item} />
              ))}
            </div>

            <div className="px-6 py-6 border-t border-stone/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-stone">Subtotal</span>
                <span className="font-mono text-base text-sumi">${subtotal}</span>
              </div>
              <p className="text-xs text-stone mb-4">
                Cash on delivery — pay when your order arrives.
              </p>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block w-full text-center bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors"
              >
                Go to bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
