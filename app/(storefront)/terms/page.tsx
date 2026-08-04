import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Terms of Service — ${brand.name}`,
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms of Service" maxWidth="max-w-3xl">
      <div className="mb-10 border border-shu/30 bg-shu/5 px-5 py-4 text-sm text-sumi">
        <strong className="block mb-1">Template — review before publishing.</strong>
        This is a starting draft, not legal advice. Have a qualified lawyer
        review it — particularly the liability, dispute resolution, and
        governing law sections — before this goes live.
      </div>

      <div className="space-y-8 text-sm text-stone leading-relaxed">
        <p>Last updated: [Date]</p>

        <section>
          <h2 className="text-sumi text-base mb-2">1. Acceptance of terms</h2>
          <p>
            By using {brand.domain} and placing an order, you agree to these
            terms. If you do not agree, please do not use the site.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">2. Orders &amp; payment</h2>
          <p>
            Orders placed through the site are currently fulfilled on a cash
            on delivery basis: no payment is taken online, and payment is due
            in cash to the courier upon delivery. We reserve the right to
            cancel an order if we&apos;re unable to confirm delivery details
            by phone within a reasonable period.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">3. Pricing &amp; availability</h2>
          <p>
            Prices are listed at the time of browsing and may change without
            notice. Items are limited-run; availability shown on the site is
            not guaranteed until an order is confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">4. Returns</h2>
          <p>
            See our{" "}
            <a href="/shipping-returns" className="text-sumi underline">
              Shipping &amp; Returns
            </a>{" "}
            page for the full return policy.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">5. Intellectual property</h2>
          <p>
            All designs, photography, and content on this site are the
            property of {brand.fullName} and may not be reproduced without
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">6. Limitation of liability</h2>
          <p>
            {brand.fullName} is not liable for indirect or consequential
            damages arising from use of the site or products, to the maximum
            extent permitted by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">7. Governing law</h2>
          <p>[Jurisdiction to be specified].</p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">8. Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${brand.contact.email}`} className="text-sumi underline">
              {brand.contact.email}
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
