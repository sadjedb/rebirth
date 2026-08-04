import Link from "next/link";
import { FormCard } from "@/components/admin/ui/FormCard";
import { formatMoney } from "@/lib/money";
import type { AdminOrderDetail, AdminOrderItem } from "@/lib/orders/admin";

function ItemRow({ item, currency }: { item: AdminOrderItem; currency: string }) {
  const nameContent = (
    <>
      <div
        className="w-9 h-9 rounded shrink-0 border border-admin-border"
        style={{ backgroundColor: item.tone || "#E4E0D6" }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-admin-fg truncate">{item.name}</p>
        <p className="text-xs text-admin-muted truncate">
          {item.sku ?? item.code} · {item.size}
        </p>
      </div>
    </>
  );

  return (
    <tr className="border-b border-admin-border last:border-b-0">
      <td className="py-3 pr-4 align-middle">
        <div className="flex items-center gap-3 min-w-[220px]">
          {/* Only linkable when the product still exists — productId is
              null once the product has been permanently deleted, and
              every other field here is a self-sufficient snapshot either
              way. */}
          {item.productId ? (
            <Link
              href={`/admin/products/${item.productId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {nameContent}
            </Link>
          ) : (
            nameContent
          )}
        </div>
      </td>
      <td className="py-3 pr-4 align-middle text-admin-muted">{item.quantity}</td>
      <td className="py-3 pr-4 align-middle text-admin-muted">{formatMoney(item.price, currency)}</td>
      <td className="py-3 pr-4 align-middle text-admin-muted">
        {item.discount > 0 ? `−${formatMoney(item.discount, currency)}` : "—"}
      </td>
      <td className="py-3 align-middle text-admin-fg text-right">
        {formatMoney(item.lineTotal, currency)}
      </td>
    </tr>
  );
}

export function ItemsCard({ order }: { order: AdminOrderDetail }) {
  return (
    <FormCard title="Items" description={`${order.items.length} line item${order.items.length === 1 ? "" : "s"}`}>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-admin-muted border-b border-admin-border">
              <th className="pb-2 pr-4 font-normal">Product</th>
              <th className="pb-2 pr-4 font-normal">Qty</th>
              <th className="pb-2 pr-4 font-normal">Unit price</th>
              <th className="pb-2 pr-4 font-normal">Discount</th>
              <th className="pb-2 font-normal text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <ItemRow key={item.id} item={item} currency={order.currency} />
            ))}
          </tbody>
        </table>
      </div>
    </FormCard>
  );
}
