import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Seal } from "@/components/ui/Seal";
import { getOrderById, formatOrderNumber, customerStatusLabel } from "@/lib/orders/storefront";
import { PAYMENT_STATUS_META, FULFILLMENT_STATUS_META } from "@/lib/orders/status";
import { formatMoney } from "@/lib/money";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Order confirmed — ${brand.name}`,
  robots: { index: false }, // order pages should never be indexed
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-2xl px-6 md:px-10 text-center">
          <Seal size={44} className="text-shu mx-auto mb-8" />

          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-3">
            Order {formatOrderNumber(order.orderNumber)}
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-sumi mb-6">
            Thank you, {order.customer.firstName}.
          </h1>
          <p className="text-sm text-stone leading-relaxed max-w-md mx-auto">
            Your order is confirmed for cash on delivery. We&apos;ll call{" "}
            <span className="text-sumi">{order.customer.phone}</span> within 24 hours to
            confirm delivery details before it ships.
          </p>

          <div className="border border-stone/20 mt-12 text-left">
            <div className="px-6 py-5 border-b border-stone/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-3">
                Status
              </p>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-stone">Order</span>
                <span className="text-sumi">{customerStatusLabel(order.status)}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-stone">Payment</span>
                <span className="text-sumi">{PAYMENT_STATUS_META[order.paymentStatus].label}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-stone">Fulfillment</span>
                <span className="text-sumi">
                  {FULFILLMENT_STATUS_META[order.fulfillmentStatus].label}
                </span>
              </div>
            </div>

            <div className="px-6 py-5 border-b border-stone/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-1">
                Delivering to
              </p>
              <p className="text-sm text-sumi">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
                {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>

            <div className="px-6 py-5">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}::${item.size}`}
                  className="flex items-center justify-between text-sm py-2"
                >
                  <span className="text-sumi">
                    {item.name} <span className="text-stone">· {item.size} × {item.quantity}</span>
                  </span>
                  <span className="font-mono text-sumi">
                    {formatMoney(item.price * item.quantity, order.currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-base pt-4 mt-2 border-t border-stone/20">
                <span className="text-sumi">Total due on delivery</span>
                <span className="font-mono text-sumi">{formatMoney(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          <Link
            href="/collection"
            className="inline-block mt-12 text-[13px] uppercase tracking-[0.14em] border border-sumi text-sumi px-6 py-3 hover:bg-sumi hover:text-washi transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
