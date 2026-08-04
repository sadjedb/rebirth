import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Seal } from "@/components/ui/Seal";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `About — ${brand.name}`,
  description: `The story and principles behind ${brand.name}.`,
};

export default function AboutPage() {
  return (
    <PageShell eyebrow="The studio" title="About MONO">
      <div className="space-y-8 text-sumi/90 leading-relaxed">
        <p className="font-display italic text-2xl md:text-3xl leading-snug text-sumi">
          MONO started from a frustration: most luxury streetwear spends its
          budget on the logo and its restraint on everything else.
        </p>

        <p>
          We build the opposite way. Every piece begins with the fabric —
          waxed cottons, coated nylons, wool suiting cloth — sourced from
          mills we return to season after season, not swapped out to chase a
          margin. The silhouette comes second: boxy where a boxy fit earns
          its place, tapered where precision matters more than volume. The
          branding comes last, if at all.
        </p>

        <p>
          The name is literal. One material per piece wherever possible. One
          colorway per drop, considered rather than expanded for the sake of
          it. One seal, stamped rather than printed, marking what actually
          left the studio rather than what could be endlessly reproduced.
        </p>

        <p>
          We&apos;re a small team. Runs are limited because the mills we work
          with are small too — when a fabric sells through, it&apos;s often
          gone for the season, not restocked from a warehouse. That&apos;s
          the trade-off we&apos;ve chosen: less availability, more
          conviction in what does ship.
        </p>

        <div className="flex items-center gap-4 pt-6">
          <Seal size={36} className="text-shu shrink-0" />
          <p className="text-sm text-stone">
            Every order is inspected and packed by hand before it leaves the
            studio.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
