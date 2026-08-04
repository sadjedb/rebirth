import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Seal } from "@/components/ui/Seal";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-washi flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-md">
          <Seal size={40} className="text-shu mx-auto mb-8" />
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-3">
            404
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-sumi mb-4">
            Nothing here.
          </h1>
          <p className="text-sm text-stone mb-10">
            The page you&apos;re looking for doesn&apos;t exist, or has moved.
          </p>
          <Link
            href="/"
            className="inline-block text-[13px] uppercase tracking-[0.14em] border border-sumi text-sumi px-6 py-3 hover:bg-sumi hover:text-washi transition-colors"
          >
            Return home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
