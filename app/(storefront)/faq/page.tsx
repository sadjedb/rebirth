import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `FAQ — ${brand.name}`,
  description: `Answers to common questions about ordering, sizing, shipping, and returns at ${brand.name}.`,
};

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: "How does cash on delivery work?",
    answer: (
      <>
        Place your order with no payment upfront. We&apos;ll call the phone
        number on your order within 24 hours to confirm details, then dispatch.
        You pay in cash to the courier when the package arrives.
      </>
    ),
  },
  {
    question: "How do I know what size to order?",
    answer: (
      <>
        Check the{" "}
        <Link href="/size-guide" className="underline hover:text-sumi">
          size guide
        </Link>{" "}
        for measurements on every category. Most pieces run true to size in a
        boxy or regular fit — the product page notes anywhere sizing runs
        differently.
      </>
    ),
  },
  {
    question: "How long does delivery take?",
    answer: "Orders dispatch within 2 business days of confirmation and arrive in 3–7 days depending on your location.",
  },
  {
    question: "What's your return policy?",
    answer:
      "Unworn items with tags attached can be returned within 14 days of delivery for a refund. See the shipping & returns page for the full policy.",
  },
  {
    question: "Do you restock sold-out items?",
    answer:
      "Rarely, and never in the same fabric run. We work with small mills in limited quantities, so a sold-out piece is usually gone for the season. Sign up to the newsletter for restock notices when they happen.",
  },
  {
    question: "How should I care for waxed cotton and coated nylon pieces?",
    answer:
      "Spot clean where possible. Waxed cotton can be re-waxed annually to maintain water resistance — avoid machine washing, which strips the wax. Full care instructions ship on the garment tag.",
  },
];

export default function FaqPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Frequently asked"
      intro={`Can't find what you're looking for? Reach out via the contact page and we'll get back to you.`}
    >
      <div className="border-t border-stone/20">
        {faqs.map((faq) => (
          <details key={faq.question} className="group border-b border-stone/20 py-5">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sumi">
              <span className="text-[15px]">{faq.question}</span>
              <span className="text-stone shrink-0 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-sm text-stone leading-relaxed max-w-xl">{faq.answer}</p>
          </details>
        ))}
      </div>

      <p className="text-sm text-stone mt-10">
        Still have a question?{" "}
        <Link href="/contact" className="text-sumi underline hover:no-underline">
          Contact the studio
        </Link>
        {" "}or write to{" "}
        <a href={`mailto:${brand.contact.email}`} className="text-sumi underline hover:no-underline">
          {brand.contact.email}
        </a>
        .
      </p>
    </PageShell>
  );
}
