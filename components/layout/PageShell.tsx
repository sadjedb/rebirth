import type { ReactNode } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

export function PageShell({
  eyebrow,
  title,
  intro,
  maxWidth = "max-w-3xl",
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  maxWidth?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className={`mx-auto ${maxWidth} px-6 md:px-10`}>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-3">
            — {eyebrow}
          </p>
          <h1 className="font-display italic text-4xl md:text-6xl text-sumi mb-6">
            {title}
          </h1>
          {intro && (
            <p className="text-sm md:text-base text-stone leading-relaxed max-w-xl mb-14 md:mb-16">
              {intro}
            </p>
          )}
          {!intro && <div className="mb-14 md:mb-16" />}
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
