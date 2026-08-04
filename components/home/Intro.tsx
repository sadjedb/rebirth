import { Reveal } from "@/components/ui/Reveal";

export function Intro() {
  return (
    <section id="about" className="bg-washi py-28 md:py-40">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10">
          <Reveal className="md:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone">
              — Statement
            </p>
          </Reveal>

          <Reveal delayMs={100} className="md:col-span-7 md:col-start-6">
            <p className="font-display italic text-3xl md:text-[2.75rem] leading-[1.25] text-sumi">
              We remove until only the garment remains. No branding to shout
              through, no seasons to chase — just proportion, fabric, and the
              discipline to leave something alone once it&apos;s right.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
