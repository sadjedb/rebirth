"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { withAuditedBulkMutation, type BulkMutationOutcome } from "@/lib/admin/bulk-actions";
import { restoreStockForCancelledOrder } from "@/lib/inventory/movements";
import {
  resolveOrderStatusTransition,
  resolveOrderPaymentStatusTransition,
  resolveOrderFulfillmentStatusTransition,
  getOrderCompletionRequirements,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  FULFILLMENT_STATUS_META,
  type OrderTransitionResult,
} from "@/lib/orders/status";

function revalidateOrders(ids: string[]) {
  revalidatePath("/admin/orders");
  for (const id of ids) revalidatePath(`/admin/orders/${id}`);
}

/**
 * The eligibility-partitioning loop every bulk status mutation below
 * needs: resolve each selected row's transition via the (already
 * centralized, in lib/orders/status.ts) resolver, split into eligible /
 * skipped-with-reason / already-at-target, and account for any selected
 * id that no longer exists. Private to this file — it's reused by the
 * three functions below, not by anything outside it, so it stays scoped
 * here rather than promoted to lib/orders/status.ts (which owns
 * transition *rules*, not this orchestration).
 */
function resolveBulkTransition<TStatus extends string, TOrder extends { id: string }>({
  ids,
  orders,
  targetStatus,
  getCurrent,
  resolve,
  meta,
  extraCheck,
}: {
  ids: string[];
  orders: TOrder[];
  targetStatus: TStatus;
  getCurrent: (order: TOrder) => TStatus;
  resolve: (from: TStatus, to: TStatus) => OrderTransitionResult<TStatus, string>;
  meta: Record<TStatus, { label: string }>;
  /** Only order-status → COMPLETED has this today; every other bulk
   *  transition omits it. */
  extraCheck?: (order: TOrder) => string[];
}): { eligibleIds: string[]; skipped: { id: string; reason: string }[]; sharedData: Prisma.OrderUpdateInput | null } {
  const eligibleIds: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  // Every eligible row transitions to the same targetStatus, so the
  // resolver's computed `data` (the field + whatever timestamp it
  // stamps) is identical for all of them — captured once and reused in
  // a single batched updateMany, rather than recomputing it per row.
  let sharedData: Prisma.OrderUpdateInput | null = null;

  for (const order of orders) {
    const transition = resolve(getCurrent(order), targetStatus);
    if (!transition.ok) {
      skipped.push({ id: order.id, reason: transition.error });
      continue;
    }
    if (!transition.audit) {
      skipped.push({ id: order.id, reason: `Already ${meta[targetStatus].label}.` });
      continue;
    }
    if (extraCheck) {
      const errors = extraCheck(order);
      if (errors.length > 0) {
        skipped.push({ id: order.id, reason: errors[0] });
        continue;
      }
    }
    eligibleIds.push(order.id);
    sharedData = transition.data as Prisma.OrderUpdateInput;
  }

  for (const id of ids) {
    if (!orders.some((o) => o.id === id) && !skipped.some((s) => s.id === id)) {
      skipped.push({ id, reason: "Order no longer exists." });
    }
  }

  return { eligibleIds, skipped, sharedData };
}

/**
 * Bulk order-status update. Processing / Completed / Cancelled all go
 * through this one function — the same generic shape as the Phase 5
 * single-record updateOrderStatus action — rather than a separate
 * dedicated "bulk cancel" function: Phase 5 already treats cancelling as
 * a branch inside the one status action (computing orders:cancel vs.
 * orders:edit dynamically), not a structurally different operation, and
 * the bulk version follows that same precedent for consistency.
 */
export async function bulkUpdateOrderStatus(ids: string[], targetStatus: OrderStatus) {
  return withAuditedBulkMutation(
    targetStatus === "CANCELLED" ? "orders:cancel" : "orders:edit",
    { action: `order.bulk_status_${targetStatus.toLowerCase()}`, entityType: "Order" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const orders: { id: string; status: OrderStatus; paymentStatus: PaymentStatus; fulfillmentStatus: FulfillmentStatus }[] =
        await prisma.order.findMany({
          where: { id: { in: ids } },
          select: { id: true, status: true, paymentStatus: true, fulfillmentStatus: true },
        });

      const { eligibleIds, skipped, sharedData } = resolveBulkTransition({
        ids,
        orders,
        targetStatus,
        getCurrent: (order) => order.status,
        resolve: resolveOrderStatusTransition,
        meta: ORDER_STATUS_META,
        extraCheck: targetStatus === "COMPLETED" ? getOrderCompletionRequirements : undefined,
      });

      if (eligibleIds.length > 0 && sharedData) {
        if (targetStatus === "CANCELLED") {
          // Module 6 (Inventory), Phase 3 — can't use the single batched
          // updateMany every other bulk transition uses: restoring stock
          // needs each order's own StockMovement rows, so each eligible
          // order gets its own transaction (status update + restore
          // together, same as the single-record action in
          // app/admin/orders/[id]/actions.ts). Sequential, not
          // Promise.all — keeps behavior identical to processing these
          // one at a time, and avoids many concurrent transactions
          // fighting over the same variant rows if two selected orders
          // happen to share one.
          for (const id of eligibleIds) {
            await prisma.$transaction(async (tx) => {
              await tx.order.update({ where: { id }, data: sharedData });
              await restoreStockForCancelledOrder(tx, id);
            });
          }
        } else {
          await prisma.order.updateMany({ where: { id: { in: eligibleIds } }, data: sharedData });
        }
      }

      revalidateOrders(eligibleIds);

      return { affectedIds: eligibleIds, skipped };
    }
  );
}

export async function bulkUpdateOrderPaymentStatus(ids: string[], targetStatus: PaymentStatus) {
  return withAuditedBulkMutation(
    "orders:edit",
    { action: `order.bulk_payment_status_${targetStatus.toLowerCase()}`, entityType: "Order" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const orders: { id: string; paymentStatus: PaymentStatus }[] = await prisma.order.findMany({
        where: { id: { in: ids } },
        select: { id: true, paymentStatus: true },
      });

      const { eligibleIds, skipped, sharedData } = resolveBulkTransition({
        ids,
        orders,
        targetStatus,
        getCurrent: (order) => order.paymentStatus,
        resolve: resolveOrderPaymentStatusTransition,
        meta: PAYMENT_STATUS_META,
      });

      if (eligibleIds.length > 0 && sharedData) {
        await prisma.order.updateMany({ where: { id: { in: eligibleIds } }, data: sharedData });
      }

      revalidateOrders(eligibleIds);

      return { affectedIds: eligibleIds, skipped };
    }
  );
}

export async function bulkUpdateOrderFulfillmentStatus(ids: string[], targetStatus: FulfillmentStatus) {
  return withAuditedBulkMutation(
    "orders:edit",
    { action: `order.bulk_fulfillment_status_${targetStatus.toLowerCase()}`, entityType: "Order" },
    async (): Promise<BulkMutationOutcome> => {
      if (ids.length === 0) return { affectedIds: [] };

      const orders: { id: string; fulfillmentStatus: FulfillmentStatus }[] = await prisma.order.findMany({
        where: { id: { in: ids } },
        select: { id: true, fulfillmentStatus: true },
      });

      const { eligibleIds, skipped, sharedData } = resolveBulkTransition({
        ids,
        orders,
        targetStatus,
        getCurrent: (order) => order.fulfillmentStatus,
        resolve: resolveOrderFulfillmentStatusTransition,
        meta: FULFILLMENT_STATUS_META,
      });

      if (eligibleIds.length > 0 && sharedData) {
        await prisma.order.updateMany({ where: { id: { in: eligibleIds } }, data: sharedData });
      }

      revalidateOrders(eligibleIds);

      return { affectedIds: eligibleIds, skipped };
    }
  );
}
