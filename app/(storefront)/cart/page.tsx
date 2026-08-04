"use client";

import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { items, subtotal, hydrated } = useCart();

  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <h1 className="font-display italic text-4xl md:text-6xl text-sumi mb-14">
            Your bag
          </h1>

          {!hydrated ? (
            <div className="py-24 text-center text-sm text-stone">Loading your bag…</div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display italic text-2xl text-sumi mb-2">
                Your bag is empty.
              </p>
              <p className="text-sm text-stone mb-8">
                Nothing to carry yet — go find something worth keeping.
              </p>
              <Link
                href="/collection"
                className="inline-block text-[13px] uppercase tracking-[0.14em] border border-sumi text-sumi px-6 py-3 hover:bg-sumi hover:text-washi transition-colors"
              >
                Browse collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12">
              <div className="md:col-span-7">
                {items.map((item) => (
                  <CartLineItem key={`${item.productId}::${item.size}`} item={item} />
                ))}
              </div>

              <div className="md:col-span-4 md:col-start-9 mt-10 md:mt-0">
                <div className="border border-stone/20 p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-5">
                    Order summary
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-stone">Subtotal</span>
                    <span className="font-mono text-sumi">${subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-5">
                    <span className="text-stone">Shipping</span>
                    <span className="font-mono text-sumi">Calculated at checkout</span>
                  </div>
                  <div className="flex items-center justify-between text-base border-t border-stone/20 pt-4 mb-6">
                    <span className="text-sumi">Total</span>
                    <span className="font-mono text-sumi">${subtotal}</span>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full text-center bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors"
                  >
                    Checkout
                  </Link>
                  <p className="text-xs text-stone mt-4 text-center">
                    Cash on delivery — pay when your order arrives.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
