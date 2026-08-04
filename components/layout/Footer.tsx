import Link from "next/link";
import { Seal } from "@/components/ui/Seal";
import { brand } from "@/config/brand";

export function Footer() {
  return (
    <footer className="bg-kachi text-washi">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 border-b border-washi/15 pb-16">
          <div className="md:col-span-4">
            <p className="font-display italic text-3xl mb-4">{brand.name}</p>
            <p className="text-sm text-washi/60 leading-relaxed max-w-xs">
              {brand.description}
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-washi/50 mb-4">
              Shop
            </p>
            <ul className="space-y-3 text-sm text-washi/80">
              <li><Link href="/collection" className="hover:text-washi transition-colors">All products</Link></li>
              <li><Link href="/collection?category=outerwear" className="hover:text-washi transition-colors">Outerwear</Link></li>
              <li><Link href="/collection?category=tops" className="hover:text-washi transition-colors">Tops</Link></li>
              <li><Link href="/collection?category=bottoms" className="hover:text-washi transition-colors">Bottoms</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-washi/50 mb-4">
              Support
            </p>
            <ul className="space-y-3 text-sm text-washi/80">
              <li><Link href="/faq" className="hover:text-washi transition-colors">FAQ</Link></li>
              <li><Link href="/size-guide" className="hover:text-washi transition-colors">Size guide</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-washi transition-colors">Shipping &amp; returns</Link></li>
              <li><Link href="/contact" className="hover:text-washi transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-washi/50 mb-4">
              Join the list
            </p>
            <form className="flex border-b border-washi/30 pb-2">
              <input
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                className="bg-transparent text-sm placeholder:text-washi/40 outline-none flex-1"
              />
              <button
                type="submit"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-washi/70 hover:text-washi transition-colors"
              >
                Submit
              </button>
            </form>
            <p className="text-[11px] text-washi/40 mt-3">
              Early access to drops. No noise.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p className="text-[11px] text-washi/40 font-mono">
              © {new Date().getFullYear()} {brand.fullName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="text-[11px] text-washi/40 hover:text-washi/70 transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-[11px] text-washi/40 hover:text-washi/70 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-[11px] text-washi/40 hover:text-washi/70 transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <Seal size={28} className="text-shu" />
        </div>
      </div>
    </footer>
  );
}
