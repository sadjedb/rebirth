import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";

/**
 * Module 6 (Inventory), Phase 3. This card used to hold sku/stock/
 * lowStockThreshold/trackInventory/continueSellingOutOfStock/sizes —
 * all removed from Product and moved to ProductVariant (see the Module
 * 6 architecture notes' Product Integration section). Stock is now a
 * per-variant fact managed from the Inventory admin section, not from
 * this form — this card is now just a pointer over there, not an editor.
 */
export function InventoryCard({ productId }: { productId?: string }) {
  return (
    <FormCard title="Inventory">
      {productId ? (
        <p className="text-sm text-admin-muted">
          Stock, SKU, and variants are managed from{" "}
          <Link href={`/admin/inventory/${productId}`} className="text-admin-accent hover:underline">
            this product&apos;s Inventory page
          </Link>
          .
        </p>
      ) : (
        <p className="text-sm text-admin-muted">
          Save this product first, then manage its stock, SKU, and variants from the Inventory section.
        </p>
      )}
    </FormCard>
  );
}
