import type { Product } from "@prisma/client";

/**
 * Replaces the old stored `inStock` boolean with real inventory rules:
 * available if inventory isn't tracked at all, there's stock on hand, or
 * backorders are explicitly allowed.
 *
 * Deliberately in its own file with no Prisma Client import (only the
 * `Product` type, which is erased at compile time) — client components
 * like AddToBag need this pure computation without pulling the entire
 * Prisma client into the browser bundle.
 */
export function isProductAvailable(
  product: Pick<Product, "trackInventory" | "stock" | "continueSellingOutOfStock">
): boolean {
  return !product.trackInventory || product.stock > 0 || product.continueSellingOutOfStock;
}
