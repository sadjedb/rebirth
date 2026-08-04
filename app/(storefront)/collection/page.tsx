import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { getProducts, getCategories } from "@/lib/products/storefront";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Collection — ${brand.name}`,
  description: `Browse the current ${brand.name} collection: outerwear, tops, and bottoms cut for restraint over noise.`,
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const isValidCategory = categories.some((c) => c.slug === params.category);
  const activeCategory = isValidCategory ? params.category : undefined;
  const products = await getProducts(activeCategory);

  return (
    <>
      <Nav />
      <main className="pt-32 md:pt-40 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <div className="mb-14 md:mb-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone mb-3">
              — Full catalog
            </p>
            <h1 className="font-display italic text-4xl md:text-6xl text-sumi mb-10">
              Collection
            </h1>
            <div className="border-t border-b border-stone/20 py-5">
              <CategoryFilter categories={categories} active={activeCategory} />
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-display italic text-2xl text-sumi mb-2">
                Nothing here yet.
              </p>
              <p className="text-sm text-stone">
                This category is between drops — check back soon.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
