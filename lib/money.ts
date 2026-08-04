import { brand } from "@/config/brand";

/**
 * Whole-dollar amounts only — see the Module 1 architecture decision to
 * defer cents-based pricing. This means costPrice/compareAtPrice can't
 * represent sub-dollar precision (e.g. $12.49 rounds to $12); acceptable
 * at current price points, worth revisiting if that changes.
 *
 * `currency` defaults to the store's currency (brand.currency) — correct
 * for Products, which has no per-row currency. Order.total (Module 2)
 * carries its own currency per row, so callers formatting an order amount
 * should pass it explicitly rather than relying on the default.
 */
export function formatMoney(amount: number, currency: string = brand.currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** price - costPrice, or null if costPrice isn't set. */
export function computeMargin(price: number, costPrice: number | null | undefined): number | null {
  if (costPrice == null) return null;
  return price - costPrice;
}

/** Margin as a percentage of price, or null if costPrice isn't set or price is 0. */
export function computeMarginPercent(price: number, costPrice: number | null | undefined): number | null {
  if (costPrice == null || price === 0) return null;
  return Math.round(((price - costPrice) / price) * 100);
}
