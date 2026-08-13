import type { ProductVariant } from "@prisma/client";

/**
 * Module 6 (Inventory), Phase 3. Replaces the old product-level
 * isProductAvailable — availability is now a per-variant fact
 * (ProductVariant.stock/trackInventory/continueSellingOutOfStock are the
 * only authoritative inventory fields left in the schema; Product no
 * longer has any of its own). Deliberately in its own file with no
 * Prisma Client value import (only the `ProductVariant` type, erased at
 * compile time) — client components like AddToBag need this pure
 * computation without pulling the Prisma client into the browser bundle.
 */

type VariantAvailabilityInput = Pick<
  ProductVariant,
  "isActive" | "trackInventory" | "stock" | "continueSellingOutOfStock"
>;

/** A single variant can be added to bag: active, and either untracked,
 *  in stock, or backorders are explicitly allowed. */
export function isVariantAvailable(variant: VariantAvailabilityInput): boolean {
  if (!variant.isActive) return false;
  return !variant.trackInventory || variant.stock > 0 || variant.continueSellingOutOfStock;
}

/** A product is available if at least one of its variants is — used for
 *  the "Sold out" badge on ProductCard and the top-level gate on
 *  AddToBag before any color/size has been picked. */
export function isProductAvailable(product: { variants: VariantAvailabilityInput[] }): boolean {
  return product.variants.some(isVariantAvailable);
}
