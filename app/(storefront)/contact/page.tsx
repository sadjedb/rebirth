import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { ContactForm } from "@/components/contact/ContactForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Contact — ${brand.name}`,
  description: `Get in touch with the ${brand.name} studio.`,
};

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Get in touch"
      title="Contact"
      intro="Order questions, product questions, wholesale, press — write to us directly and we'll route it to the right person."
    >
      <ContactForm />

      <div className="mt-16 pt-10 border-t border-stone/20 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-2">Email</p>
          <a href={`mailto:${brand.contact.email}`} className="text-sm text-sumi hover:underline">
            {brand.contact.email}
          </a>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone mb-2">
            Response time
          </p>
          <p className="text-sm text-sumi">1–2 business days</p>
        </div>
      </div>
    </PageShell>
  );
}
