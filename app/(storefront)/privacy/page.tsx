import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Privacy Policy — ${brand.name}`,
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Legal" title="Privacy Policy" maxWidth="max-w-3xl">
      <div className="mb-10 border border-shu/30 bg-shu/5 px-5 py-4 text-sm text-sumi">
        <strong className="block mb-1">Template — review before publishing.</strong>
        This is a starting draft, not legal advice. Have a qualified lawyer
        review it against your actual data practices, payment/shipping
        partners, and the jurisdictions you sell into before this goes live.
      </div>

      <div className="space-y-8 text-sm text-stone leading-relaxed">
        <p>Last updated: [Date]</p>

        <section>
          <h2 className="text-sumi text-base mb-2">1. Information we collect</h2>
          <p>
            When you place an order, we collect your name, email, phone
            number, and delivery address in order to fulfill it. When you
            browse the site, we may collect standard technical data
            (IP address, browser type, pages visited) via cookies or similar
            technologies for analytics and security purposes.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">2. How we use it</h2>
          <p>
            We use your information to process and deliver orders, confirm
            cash-on-delivery details by phone, respond to support requests,
            and — where you&apos;ve opted in — send updates about new
            releases. We do not sell your personal information to third
            parties.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">3. Sharing</h2>
          <p>
            We share order and delivery information with the courier
            partners fulfilling your delivery. We may share data with
            service providers who help operate the site (hosting,
            analytics) under confidentiality obligations.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">4. Data retention</h2>
          <p>
            We retain order records for as long as needed for accounting,
            warranty, and legal purposes. You can request deletion of your
            account data at any time, subject to records we&apos;re legally
            required to keep.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">5. Your rights</h2>
          <p>
            Depending on your location, you may have the right to access,
            correct, or delete your personal data, and to object to certain
            processing. Contact us at{" "}
            <a href={`mailto:${brand.contact.email}`} className="text-sumi underline">
              {brand.contact.email}
            </a>{" "}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">6. Cookies</h2>
          <p>
            We use essential cookies to operate the shopping cart and, where
            enabled, analytics cookies to understand site usage. You can
            control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-sumi text-base mb-2">7. Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
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
