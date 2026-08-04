"use client";

import { useState } from "react";
import type { Product } from "@/lib/products/storefront";
import { iconPaths } from "@/lib/product-icons";

const PLACEHOLDER_VIEWS = ["Front", "Back", "Detail"] as const;

export function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);

  if (product.media.length > 0) {
    return <MediaGallery media={product.media} productName={product.name} tone={product.tone} />;
  }

  // No real media yet — fall back to the simulated placeholder views.
  return (
    <div>
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ backgroundColor: product.tone ?? "#E4E0D6" }}
      >
        {product.icon && (
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full p-16 text-kachi/25 transition-transform duration-500"
            style={{
              transform:
                active === 1 ? "scaleX(-1)" : active === 2 ? "scale(1.6)" : "none",
            }}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          >
            <path d={iconPaths[product.icon]} />
          </svg>
        )}
        <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.15em] text-kachi/60">
          {PLACEHOLDER_VIEWS[active]}
        </span>
      </div>

      <div className="flex gap-3 mt-3">
        {PLACEHOLDER_VIEWS.map((view, i) => (
          <button
            key={view}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${view} view`}
            aria-current={active === i}
            className={`flex-1 aspect-square relative overflow-hidden border transition-colors ${
              active === i ? "border-sumi" : "border-stone/25 hover:border-stone/50"
            }`}
            style={{ backgroundColor: product.tone ?? "#E4E0D6" }}
          >
            {product.icon && (
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full p-5 text-kachi/25"
                style={{ transform: i === 1 ? "scaleX(-1)" : i === 2 ? "scale(1.6)" : "none" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
              >
                <path d={iconPaths[product.icon]} />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function MediaGallery({
  media,
  productName,
  tone,
}: {
  media: Product["media"];
  productName: string;
  tone: string | null;
}) {
  const [active, setActive] = useState(0);
  const current = media[active];

  return (
    <div>
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ backgroundColor: tone ?? "#E4E0D6" }}
      >
        {current.type === "VIDEO" ? (
          <video
            src={current.url}
            poster={current.thumbnailUrl ?? undefined}
            controls
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves optimized/responsive URLs
          <img
            src={current.url}
            alt={current.altText ?? productName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-3 mt-3">
          {media.map((item: Product["media"][number], i: number) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show media ${i + 1}`}
              aria-current={active === i}
              className={`flex-1 aspect-square relative overflow-hidden border transition-colors ${
                active === i ? "border-sumi" : "border-stone/25 hover:border-stone/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size thumbnail */}
              <img
                src={item.type === "VIDEO" ? item.thumbnailUrl ?? item.url : item.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
