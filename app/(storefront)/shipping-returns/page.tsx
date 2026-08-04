import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Shipping & Returns — ${brand.name}`,
  description: "Delivery times, cash on delivery details, and our return policy.",
};

export default function ShippingReturnsPage() {
  return (
    <PageShell eyebrow="Support" title="Shipping & Returns" maxWidth="max-w-3xl">
      <div className="space-y-10 text-sm text-stone leading-relaxed">
        <section>
          <h2 className="text-sumi text-base mb-2">Cash on delivery</h2>
          <p>
            No payment is required to place an order. We&apos;ll call the
            phone number on your order within 24 hours to confirm your
            details before dispatch. Payment is due in cash to the courier
            when your order arrives.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">Dispatch &amp; delivery times</h2>
          <p>
            Orders are inspected, packed, and dispatched within 2 business
            days of phone confirmation. Delivery typically takes 3–7
            business days depending on your location.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">Returns</h2>
          <p>
            Unworn items with tags attached may be returned within 14 days
            of delivery for a refund. To start a return, contact{" "}
            <a href={`mailto:${brand.contact.email}`} className="text-sumi underline">
              {brand.contact.email}
            </a>{" "}
            with your order number. Since orders are paid on delivery,
            refunds are issued via bank transfer once the returned item is
            received and inspected.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">Exchanges</h2>
          <p>
            We don&apos;t process direct exchanges. Return the original item
            for a refund and place a new order for the size or piece you
            need — this keeps limited-run stock accurate for everyone.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">Damaged or incorrect items</h2>
          <p>
            If an item arrives damaged or incorrect, contact us within 48
            hours of delivery with photos and your order number, and we&apos;ll
            arrange a replacement or refund at no cost to you.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
