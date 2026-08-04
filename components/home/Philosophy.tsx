import { Reveal } from "@/components/ui/Reveal";
import { Seal } from "@/components/ui/Seal";

export function Philosophy() {
  return (
    <section id="philosophy" className="bg-washi py-32 md:py-44">
      <div className="mx-auto max-w-3xl px-6 md:px-10 text-center flex flex-col items-center">
        <Reveal>
          <Seal size={40} className="text-shu mb-10" />
        </Reveal>
        <Reveal delayMs={100}>
          <p className="font-display italic text-3xl md:text-5xl leading-[1.3] text-sumi">
            Luxury isn&apos;t what you add. It&apos;s what you have the
            confidence to leave out.
          </p>
        </Reveal>
        <Reveal delayMs={200}>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mt-10">
            — Founding principle, MONO
          </p>
        </Reveal>
      </div>
    </section>
  );
}
