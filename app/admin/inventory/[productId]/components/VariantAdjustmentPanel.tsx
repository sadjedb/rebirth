"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { adjustVariantStock } from "@/app/admin/inventory/[productId]/actions";
import type { ProductInventoryDetail } from "@/lib/inventory/admin";

type Variant = ProductInventoryDetail["variants"][number];

function formatVariantIdentity(variant: Pick<Variant, "color" | "size">): string {
  if (variant.color && variant.size) return `${variant.color} / ${variant.size}`;
  if (variant.color) return variant.color;
  if (variant.size) return variant.size;
  return "Default";
}

const REASON_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order placed",
  ORDER_CANCELLED: "Order cancelled",
  MANUAL_ADJUSTMENT: "Manual adjustment",
  BULK_ADJUSTMENT: "Bulk adjustment",
  RESTOCK: "Restock",
};

function AdjustmentRow({
  productId,
  variant,
  canAdjust,
}: {
  productId: string;
  variant: Variant;
  canAdjust: boolean;
}) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await adjustVariantStock(productId, { variantId: variant.id, delta, note });
      if (!result.success) {
        setError(result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? "Adjustment failed.");
        return;
      }
      setSuccess(`Stock updated to ${result.resultingStock}.`);
      setDelta("");
      setNote("");
    });
  }

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="py-3 pr-4">
        <p className="text-admin-fg">{formatVariantIdentity(variant)}</p>
        <p className="text-xs text-admin-muted">{variant.sku ?? "No SKU"}</p>
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-admin-fg">{variant.stock}</span>
          {!variant.isActive && <Badge variant="neutral">Inactive</Badge>}
          {!variant.trackInventory && <Badge variant="neutral">Untracked</Badge>}
          {variant.continueSellingOutOfStock && <Badge variant="warning">Backorder</Badge>}
        </div>
      </td>
      <td className="py-3">
        {canAdjust ? (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="±qty"
              aria-label={`Adjustment amount for ${formatVariantIdentity(variant)}`}
              className="w-24 text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2 py-1.5 outline-none focus:border-admin-accent"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason (required)"
              aria-label={`Adjustment note for ${formatVariantIdentity(variant)}`}
              className="flex-1 min-w-[160px] text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-2 py-1.5 outline-none focus:border-admin-accent"
            />
            <button
              type="submit"
              disabled={isPending || !delta || !note}
              className="text-sm px-3 py-1.5 rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : "Adjust"}
            </button>
            {error && <span className="text-xs text-admin-danger w-full">{error}</span>}
            {success && <span className="text-xs text-admin-success w-full">{success}</span>}
          </form>
        ) : (
          <span className="text-xs text-admin-muted">View only</span>
        )}
      </td>
    </tr>
  );
}

export function VariantAdjustmentPanel({
  productId,
  variants,
  movements,
  canAdjust,
}: {
  productId: string;
  variants: Variant[];
  movements: ProductInventoryDetail["movements"];
  canAdjust: boolean;
}) {
  const variantIdentity = new Map(variants.map((v) => [v.id, formatVariantIdentity(v)]));

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-admin-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-admin-surface text-left text-xs uppercase tracking-wide text-admin-muted">
            <tr>
              <th className="py-2.5 px-4 font-medium">Variant</th>
              <th className="py-2.5 px-4 font-medium">Stock</th>
              <th className="py-2.5 px-4 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="px-4">
            {variants.map((variant) => (
              <AdjustmentRow key={variant.id} productId={productId} variant={variant} canAdjust={canAdjust} />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-sm font-medium text-admin-fg mb-3">Recent movements</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-admin-muted">No stock movements yet.</p>
        ) : (
          <div className="rounded-lg border border-admin-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-admin-surface text-left text-xs uppercase tracking-wide text-admin-muted">
                <tr>
                  <th className="py-2.5 px-4 font-medium">When</th>
                  <th className="py-2.5 px-4 font-medium">Variant</th>
                  <th className="py-2.5 px-4 font-medium">Reason</th>
                  <th className="py-2.5 px-4 font-medium">Change</th>
                  <th className="py-2.5 px-4 font-medium">Resulting</th>
                  <th className="py-2.5 px-4 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t border-admin-border">
                    <td className="py-2.5 px-4 text-admin-muted">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-admin-fg">
                      {variantIdentity.get(m.variantId) ?? "—"}
                    </td>
                    <td className="py-2.5 px-4 text-admin-fg">{REASON_LABEL[m.reason] ?? m.reason}</td>
                    <td className={`py-2.5 px-4 ${m.quantityDelta < 0 ? "text-admin-danger" : "text-admin-success"}`}>
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </td>
                    <td className="py-2.5 px-4 text-admin-fg">{m.resultingStock}</td>
                    <td className="py-2.5 px-4 text-admin-muted">{m.actorEmail ?? "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
