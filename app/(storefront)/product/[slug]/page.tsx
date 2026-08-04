import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Gallery } from "@/components/product/Gallery";
import { AddToBag } from "@/components/product/AddToBag";
import { DetailsAccordion } from "@/components/product/DetailsAccordion";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/products/storefront";
import { isProductAvailable } from "@/lib/products/availability";
import { brand } from "@/config/brand";

function ProductJsonLd({ product, url }: { product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>; url: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.code,
    // No `image` field yet — there's no real product photography to point
    // to. Add it once product photos exist; a placeholder image here would
    // actively mislead search results.
    brand: { "@type": "Brand", name: brand.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: brand.currency,
      price: product.price,
      availability: isProductAvailable(product)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} — ${brand.name}`,
    description: product.description,
    alternates: { canonical: `https://${brand.domain}/product/${product.slug}` },
    openGraph: {
      title: `${product.name} — ${brand.name}`,
      description: product.description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.slug);
  const url = `https://${brand.domain}/product/${product.slug}`;

  return (
    <>
      <ProductJsonLd product={product} url={url} />
      <Nav />
      <main className="pt-28 md:pt-32 pb-24 md:pb-32 bg-washi min-h-screen">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <nav aria-label="Breadcrumb" className="mb-8 md:mb-12">
            <ol className="flex items-center gap-2 text-xs text-stone">
              <li>
                <Link href="/" className="hover:text-sumi transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/collection" className="hover:text-sumi transition-colors">
                  Collection
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-sumi">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
            <div className="lg:col-span-7">
              <Gallery product={product} />
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <div className="lg:sticky lg:top-32">
                <p className="font-mono text-[11px] tracking-wide text-stone mb-2">
                  {product.code}
                </p>
                <h1 className="font-display italic text-3xl md:text-4xl text-sumi leading-tight">
                  {product.name}
                </h1>
                <p className="font-mono text-lg text-sumi mt-4">${product.price}</p>

                <p className="text-sm text-stone leading-relaxed mt-6">
                  {product.description}
                </p>

                <AddToBag product={product} />
                <DetailsAccordion product={product} />
              </div>
            </div>
          </div>

          <RelatedProducts products={related} />
        </div>
      </main>
      <Footer />
    </>
  );
}
