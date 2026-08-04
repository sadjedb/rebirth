import { Seal } from "@/components/ui/Seal";
import { brand } from "@/config/brand";

export function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-kachi text-washi">
      {/* Grain texture — keeps the flat dark field from feeling like a solid CSS block */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay pointer-events-none">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Ambient vertical gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-kachi via-kachi to-[#0a0c12]" />

      <div className="relative z-10 h-full mx-auto max-w-[1440px] px-6 md:px-10 flex flex-col justify-end pb-16 md:pb-20">
        <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.25em] text-washi/60 mb-6">
          Collection 01 — Est. 2026
        </p>

        <h1 className="font-display italic text-[15vw] md:text-[9vw] leading-[0.95] tracking-tight max-w-4xl">
          {brand.tagline}
        </h1>

        <div className="mt-10 flex items-end justify-between gap-8">
          <p className="max-w-sm text-sm md:text-[15px] text-washi/70 leading-relaxed">
            {brand.description}
          </p>
          <Seal size={64} className="hidden md:block text-shu shrink-0" />
        </div>
      </div>

      <div className="absolute bottom-8 left-6 md:left-10 z-10 flex items-center gap-3 text-washi/50">
        <span className="h-8 w-px bg-washi/30" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll</span>
      </div>
    </section>
  );
}
