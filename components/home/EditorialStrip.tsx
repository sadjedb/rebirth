import { Reveal } from "@/components/ui/Reveal";

export function EditorialStrip() {
  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-stone">
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay pointer-events-none">
        <filter id="grain2">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain2)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-kachi/70 via-transparent to-transparent" />

      <div className="relative z-10 h-full mx-auto max-w-[1440px] px-6 md:px-10 flex items-end pb-14">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-washi/70 mb-3">
            — Field notes, Kyoto
          </p>
          <p className="font-display italic text-2xl md:text-4xl text-washi max-w-2xl leading-tight">
            Every fabric is chosen the way you&apos;d choose a room to be
            quiet in.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
