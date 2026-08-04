import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/lib/products/storefront";

export async function FeaturedDrop() {
  const products = (await getProducts()).slice(0, 3);

  return (
    <section id="collection" className="bg-washi py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <div className="flex items-end justify-between mb-14 md:mb-16 border-b border-stone/20 pb-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-3">
                — Collection 01
              </p>
              <h2 className="font-display italic text-4xl md:text-5xl text-sumi">
                Current release
              </h2>
            </div>
            <Link
              href="/collection"
              className="hidden md:block text-[13px] uppercase tracking-[0.14em] text-sumi border-b border-sumi/40 pb-1 hover:border-sumi transition-colors"
            >
              View all
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {products.map((product, i) => (
            <Reveal key={product.code} delayMs={i * 100}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
