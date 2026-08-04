import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/products/storefront";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-28 md:mt-36 border-t border-stone/20 pt-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-8">
        — You may also like
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
