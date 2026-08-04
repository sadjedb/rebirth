"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { useCart } from "@/lib/cart-context";

export default function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  if (!hydrated || items.length === 0) {
    return (
      <>
        <Nav />
        <main className="pt-32 pb-24 bg-washi min-h-screen">
          <div className="mx-auto max-w-4xl px-6 md:px-10 py-24 text-center text-sm text-stone">
            {hydrated ? "Redirecting to your bag…" : "Loading…"}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-10 md:mb-14">
            <Link href="/cart" className="text-xs text-stone hover:text-sumi transition-colors">
              ← Back to bag
            </Link>
            <h1 className="font-display italic text-4xl md:text-6xl text-sumi mt-4">
              Checkout
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-14 gap-y-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-6">
                — Delivery details
              </p>
              <CheckoutForm />
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <div className="lg:sticky lg:top-32">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-4">
                  — Your bag
                </p>
                <div className="border-t border-stone/20">
                  {items.map((item) => (
                    <CartLineItem key={`${item.productId}::${item.size}`} item={item} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-base pt-5">
                  <span className="text-sumi">Total</span>
                  <span className="font-mono text-sumi">${subtotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
