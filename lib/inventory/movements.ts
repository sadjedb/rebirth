import "server-only";
import type { Prisma, StockMovementReason } from "@prisma/client";

/**
 * Module 6 (Inventory), Phase 3.
 *
 * Every function here takes a `Prisma.TransactionClient`, never the bare
 * `prisma` client — every caller (checkout's createOrder, an order's
 * CANCELLED transition, a manual admin adjustment) needs the stock write
 * and its StockMovement row to commit or roll back together with the
 * rest of that operation. See the Module 6 architecture notes'
 * Concurrency Strategy and Failure/Recovery sections.
 */

type VariantForDecrement = {
  id: string;
  productId: string;
  stock: number;
  trackInventory: boolean;
  continueSellingOutOfStock: boolean;
};

export type StockDecrementResult =
  | { ok: true; appliedDelta: number; resultingStock: number }
  | { ok: false; reason: "OUT_OF_STOCK" };

/**
 * The checkout decrement algorithm locked in the Module 6 architecture:
 *
 *   trackInventory = false        → no stock mutation, no movement.
 *   stock >= quantity             → decrement the full quantity (normal
 *                                    path — the overwhelming majority of
 *                                    sales).
 *   insufficient + !continueSelling → reject (caller rolls back).
 *   insufficient + continueSelling  → floor the counter to exactly zero
 *                                      rather than letting it go
 *                                      negative. The sale itself still
 *                                      proceeds for the full requested
 *                                      quantity — OrderItem.quantity
 *                                      records that — but the returned
 *                                      `appliedDelta` only reflects what
 *                                      actually changed on the counter,
 *                                      which may be smaller in magnitude
 *                                      than `quantity`. This is the
 *                                      stock-counter-vs-sales-quantity
 *                                      distinction documented on the
 *                                      StockMovement model itself — never
 *                                      read `appliedDelta` as "units
 *                                      sold".
 *
 * `stock >= 0` is enforced entirely through conditional `WHERE` guards on
 * the update itself (no separate read-then-write), the same
 * concurrency-safe pattern `redeemCouponInTransaction` already
 * established — two concurrent callers racing for the same variant's
 * last unit serialize at the database row-lock level; the loser's guard
 * simply doesn't match and it falls through to the
 * insufficient-stock branch. No raw SQL.
 *
 * The caller passes in `variant` freshly read (inside the same
 * transaction, immediately before calling this) rather than this
 * function re-reading it — this matters when one order buys the same
 * variant across more than one line: each call must see the previous
 * call's committed write, which a stale outer-scope `variant` object
 * would not.
 */
export async function decrementVariantStock(
  tx: Prisma.TransactionClient,
  variant: VariantForDecrement,
  quantity: number
): Promise<StockDecrementResult> {
  if (!variant.trackInventory) {
    return { ok: true, appliedDelta: 0, resultingStock: variant.stock };
  }

  const guarded = await tx.productVariant.updateMany({
    where: { id: variant.id, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });

  if (guarded.count === 1) {
    return { ok: true, appliedDelta: -quantity, resultingStock: variant.stock - quantity };
  }

  if (!variant.continueSellingOutOfStock) {
    return { ok: false, reason: "OUT_OF_STOCK" };
  }

  // Floor to zero. `stock: { gt: 0 }` makes this a no-op (count === 0)
  // once the counter is already at the floor — expected and harmless
  // when a variant is oversold across more than one concurrent order:
  // the sale still proceeds for each of them (continueSellingOutOfStock
  // means exactly that), but only the transaction that actually crossed
  // the counter to zero records a non-zero movement.
  await tx.productVariant.updateMany({
    where: { id: variant.id, stock: { gt: 0 } },
    data: { stock: 0 },
  });

  const fresh = await tx.productVariant.findUniqueOrThrow({
    where: { id: variant.id },
    select: { stock: true },
  });

  return { ok: true, appliedDelta: fresh.stock - variant.stock, resultingStock: fresh.stock };
}

export async function recordStockMovement(
  tx: Prisma.TransactionClient,
  input: {
    variantId: string;
    productId: string;
    quantityDelta: number;
    resultingStock: number;
    reason: StockMovementReason;
    note?: string | null;
    orderId?: string | null;
    warehouseId?: string | null;
    actorId?: string | null;
    actorEmail?: string | null;
  }
) {
  return tx.stockMovement.create({ data: input });
}

/**
 * Cancellation restoration. Only ever called from the order status
 * transition that actually moves an order to CANCELLED (see
 * lib/orders/status.ts) — the state machine itself guarantees this runs
 * at most once per order, since CANCELLED is never a source state for
 * any further transition.
 *
 * Restores using the ORIGINAL ORDER_PLACED movements' own variantId and
 * quantityDelta — never by re-resolving OrderItem.variantId against
 * current product/variant state. This is what makes restoration correct
 * even if a variant has since been deactivated: the stock lands back on
 * the exact variant it was taken from, active or not.
 *
 * A movement with quantityDelta === 0 (a line that was already fully
 * floored to zero at purchase time under continueSellingOutOfStock — see
 * decrementVariantStock above) has nothing to restore; skipped rather
 * than writing a no-op compensating row, since a StockMovement is
 * meant to represent something that actually happened to the counter.
 */
export async function restoreStockForCancelledOrder(tx: Prisma.TransactionClient, orderId: string) {
  const placedMovements = await tx.stockMovement.findMany({
    where: { orderId, reason: "ORDER_PLACED" },
    select: { variantId: true, productId: true, quantityDelta: true },
  });

  for (const movement of placedMovements) {
    if (movement.quantityDelta === 0) continue;

    const restoreAmount = -movement.quantityDelta;
    const updated = await tx.productVariant.update({
      where: { id: movement.variantId },
      data: { stock: { increment: restoreAmount } },
      select: { stock: true },
    });

    await recordStockMovement(tx, {
      variantId: movement.variantId,
      productId: movement.productId,
      quantityDelta: restoreAmount,
      resultingStock: updated.stock,
      reason: "ORDER_CANCELLED",
      orderId,
    });
  }
}

export type ManualAdjustmentResult =
  | { ok: true; resultingStock: number }
  | { ok: false; reason: "NOT_FOUND" }
  | { ok: false; reason: "WOULD_GO_NEGATIVE" };

/**
 * Manual/bulk admin adjustment. Unlike checkout's decrementVariantStock,
 * there is no continueSellingOutOfStock exception here — a human driving
 * a variant negative is presumptively a data-entry mistake, not an
 * intentional sale, regardless of that flag (see the Module 6
 * architecture notes). `delta` is signed: negative to remove stock,
 * positive to add it. A positive delta can never fail the guard (there's
 * no negative-stock risk in an increment), so only decrements are
 * guarded.
 */
export async function applyManualStockAdjustment(
  tx: Prisma.TransactionClient,
  input: {
    variantId: string;
    delta: number;
    reason: "MANUAL_ADJUSTMENT" | "BULK_ADJUSTMENT";
    note: string;
    actorId: string;
    actorEmail: string;
  }
): Promise<ManualAdjustmentResult> {
  const variant = await tx.productVariant.findUnique({
    where: { id: input.variantId },
    select: { id: true, productId: true, stock: true },
  });
  if (!variant) return { ok: false, reason: "NOT_FOUND" };

  if (input.delta < 0) {
    const guarded = await tx.productVariant.updateMany({
      where: { id: variant.id, stock: { gte: -input.delta } },
      data: { stock: { decrement: -input.delta } },
    });
    if (guarded.count === 0) return { ok: false, reason: "WOULD_GO_NEGATIVE" };
  } else {
    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stock: { increment: input.delta } },
    });
  }

  const fresh = await tx.productVariant.findUniqueOrThrow({
    where: { id: variant.id },
    select: { stock: true },
  });

  await recordStockMovement(tx, {
    variantId: variant.id,
    productId: variant.productId,
    quantityDelta: input.delta,
    resultingStock: fresh.stock,
    reason: input.reason,
    note: input.note,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
  });

  return { ok: true, resultingStock: fresh.stock };
}
