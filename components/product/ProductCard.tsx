import Link from "next/link";
import type { Product } from "@/lib/products/storefront";
import { isProductAvailable } from "@/lib/products/availability";
import { iconPaths } from "@/lib/product-icons";

export function ProductCard({ product }: { product: Product }) {
  const available = isProductAvailable(product);
  const featuredMedia = product.media[0];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ backgroundColor: featuredMedia ? undefined : product.tone ?? "#E4E0D6" }}
      >
        {featuredMedia ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimized/responsive URLs; next/image's own transform would be redundant
          <img
            src={featuredMedia.url}
            alt={featuredMedia.altText ?? product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : product.icon ? (
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full p-14 text-kachi/25 transition-transform duration-700 ease-out group-hover:scale-[1.04] group-hover:text-kachi/35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          >
            <path d={iconPaths[product.icon]} />
          </svg>
        ) : null}

        {!available && (
          <span className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.15em] text-kachi bg-washi/90 px-2.5 py-1">
            Sold out
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-kachi bg-washi/90 px-3 py-1.5">
            View piece
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] text-sumi">{product.name}</h3>
          <p className="font-mono text-[11px] tracking-wide text-stone mt-1">
            {product.code}
          </p>
        </div>
        <p className="font-mono text-[13px] text-sumi shrink-0">
          ${product.price}
        </p>
      </div>
    </Link>
  );
}
