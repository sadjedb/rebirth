"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { withAuditedMutation } from "@/lib/audit";
import { checkPermission } from "@/lib/admin/auth";
import { assertNotStale, ConcurrencyError } from "@/lib/admin/concurrency";
import { sendEmail } from "@/lib/email";
import { formatOrderNumber, customerStatusLabel, EMAIL_NOT_CONFIGURED_ERROR } from "@/lib/orders/format";
import {
  resolveOrderStatusTransition,
  resolveOrderPaymentStatusTransition,
  resolveOrderFulfillmentStatusTransition,
  getOrderCompletionRequirements,
} from "@/lib/orders/status";
import { restoreStockForCancelledOrder } from "@/lib/inventory/movements";
import {
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  updateFulfillmentStatusSchema,
  addOrderNoteSchema,
} from "@/app/admin/orders/validators";

export type OrderMutationResult = { success: true } | { success: false; error: string; conflict?: boolean };

function revalidateOrder(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/**
 * Shared by the three status mutations below — each needs the exact same
 * assertNotStale → ConcurrencyError → conflict-result shape. Private to
 * this file since nothing outside it needs this specific result shape.
 * Returns null when the record isn't stale (safe to proceed).
 */
function checkNotStale(submittedUpdatedAt: string, currentUpdatedAt: Date): OrderMutationResult | null {
  try {
    assertNotStale(submittedUpdatedAt, currentUpdatedAt);
    return null;
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return {
        success: false,
        conflict: true,
        error: "This order was changed by someone else. Reload the page to see the latest version.",
      };
    }
    throw error;
  }
}

export async function updateOrderStatus(
  id: string,
  updatedAt: string,
  raw: unknown
): Promise<OrderMutationResult> {
  const parsed = updateOrderStatusSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid order status." };
  const { to } = parsed.data;

  // Cancelling is a bigger deal than an ordinary status edit — same
  // reasoning as products:delete having its own capability separate from
  // products:edit (see the Phase 1 architecture notes).
  const capability = to === "CANCELLED" ? "orders:cancel" : "orders:edit";
  const authError = await checkPermission(capability);
  if (authError) return authError;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true, paymentStatus: true, fulfillmentStatus: true, updatedAt: true },
  });
  if (!existing) return { success: false, error: "This order no longer exists." };

  const staleResult = checkNotStale(updatedAt, existing.updatedAt);
  if (staleResult) return staleResult;

  const transition = resolveOrderStatusTransition(existing.status, to);
  if (!transition.ok) return { success: false, error: transition.error };
  // Same-value "transition" — nothing changed, nothing to do or audit.
  if (!transition.audit) return { success: true };

  if (to === "COMPLETED") {
    const requirementErrors = getOrderCompletionRequirements(existing);
    if (requirementErrors.length > 0) {
      return { success: false, error: requirementErrors.join(" ") };
    }
  }

  const audit = transition.audit;
  return withAuditedMutation(
    capability,
    { action: audit.action, entityType: "Order" },
    async () => {
      // Module 6 (Inventory), Phase 3 — CANCELLED is the only order
      // status transition that restores stock, and this is the only
      // place it can fire from (the state machine above already
      // guarantees CANCELLED is never reached more than once, since it's
      // not a source state for any further transition — see
      // lib/orders/status.ts). Restoration and the order's own status
      // update happen in one transaction: either both commit or neither
      // does.
      if (to === "CANCELLED") {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id }, data: transition.data as Prisma.OrderUpdateInput });
          await restoreStockForCancelledOrder(tx, id);
        });
      } else {
        await prisma.order.update({ where: { id }, data: transition.data as Prisma.OrderUpdateInput });
      }
      revalidateOrder(id);
      return { result: { success: true as const }, entityId: id, metadata: audit.metadata };
    }
  );
}

export async function updateOrderPaymentStatus(
  id: string,
  updatedAt: string,
  raw: unknown
): Promise<OrderMutationResult> {
  const parsed = updatePaymentStatusSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid payment status." };
  const { to } = parsed.data;

  const authError = await checkPermission("orders:edit");
  if (authError) return authError;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { paymentStatus: true, updatedAt: true },
  });
  if (!existing) return { success: false, error: "This order no longer exists." };

  const staleResult = checkNotStale(updatedAt, existing.updatedAt);
  if (staleResult) return staleResult;

  const transition = resolveOrderPaymentStatusTransition(existing.paymentStatus, to);
  if (!transition.ok) return { success: false, error: transition.error };
  if (!transition.audit) return { success: true };

  const audit = transition.audit;
  return withAuditedMutation(
    "orders:edit",
    { action: audit.action, entityType: "Order" },
    async () => {
      await prisma.order.update({ where: { id }, data: transition.data as Prisma.OrderUpdateInput });
      revalidateOrder(id);
      return { result: { success: true as const }, entityId: id, metadata: audit.metadata };
    }
  );
}

export async function updateOrderFulfillmentStatus(
  id: string,
  updatedAt: string,
  raw: unknown
): Promise<OrderMutationResult> {
  const parsed = updateFulfillmentStatusSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid fulfillment status." };
  const { to } = parsed.data;

  const authError = await checkPermission("orders:edit");
  if (authError) return authError;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { fulfillmentStatus: true, updatedAt: true },
  });
  if (!existing) return { success: false, error: "This order no longer exists." };

  const staleResult = checkNotStale(updatedAt, existing.updatedAt);
  if (staleResult) return staleResult;

  const transition = resolveOrderFulfillmentStatusTransition(existing.fulfillmentStatus, to);
  if (!transition.ok) return { success: false, error: transition.error };
  if (!transition.audit) return { success: true };

  const audit = transition.audit;
  return withAuditedMutation(
    "orders:edit",
    { action: audit.action, entityType: "Order" },
    async () => {
      await prisma.order.update({ where: { id }, data: transition.data as Prisma.OrderUpdateInput });
      revalidateOrder(id);
      return { result: { success: true as const }, entityId: id, metadata: audit.metadata };
    }
  );
}

/**
 * A note is purely an AuditLog write (action: "order.note_added") — it
 * never touches the Order row itself, so unlike the three status
 * mutations above, there's no assertNotStale check here: there's nothing
 * on the row that could go stale. See lib/orders/timeline.ts for how
 * this becomes both the "Notes" section and a timeline entry from the
 * same underlying data, with no separate storage.
 */
export async function addOrderNote(id: string, raw: unknown): Promise<OrderMutationResult> {
  const parsed = addOrderNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const authError = await checkPermission("orders:edit");
  if (authError) return authError;

  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { success: false, error: "This order no longer exists." };

  return withAuditedMutation(
    "orders:edit",
    { action: "order.note_added", entityType: "Order" },
    async () => {
      revalidatePath(`/admin/orders/${id}`);
      return { result: { success: true as const }, entityId: id, metadata: { note: parsed.data.note } };
    }
  );
}

// ---------------------------------------------------------------------------
// Phase 8 — customer service. Neither action below touches the Order row
// (sending an email changes nothing about the order itself), so — same
// reasoning as addOrderNote above — there's no assertNotStale check.
// Audited only on an actual send: if email isn't configured, nothing
// happened, so nothing is written to the audit trail, matching the
// established "no-op → no audit" rule from Phase 5/6 rather than
// inventing a new rule for this phase.
// ---------------------------------------------------------------------------

async function loadOrderForEmail(id: string) {
  return prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      firstName: true,
      total: true,
      currency: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
    },
  });
}

export async function resendOrderConfirmation(id: string): Promise<OrderMutationResult> {
  const authError = await checkPermission("orders:edit");
  if (authError) return authError;

  const order = await loadOrderForEmail(id);
  if (!order) return { success: false, error: "This order no longer exists." };

  const emailResult = await sendEmail({
    to: order.email,
    subject: `Your order ${formatOrderNumber(order.orderNumber)} confirmation`,
    text: `Hi ${order.firstName}, here's a copy of your order ${formatOrderNumber(order.orderNumber)} confirmation. Total: ${order.total} ${order.currency}.`,
  });
  if (!emailResult.sent) return { success: false, error: EMAIL_NOT_CONFIGURED_ERROR };

  return withAuditedMutation(
    "orders:edit",
    { action: "order.resend_confirmation", entityType: "Order" },
    async () => {
      revalidatePath(`/admin/orders/${id}`);
      return { result: { success: true as const }, entityId: id, metadata: { to: order.email } };
    }
  );
}

export async function resendOrderStatusEmail(id: string): Promise<OrderMutationResult> {
  const authError = await checkPermission("orders:edit");
  if (authError) return authError;

  const order = await loadOrderForEmail(id);
  if (!order) return { success: false, error: "This order no longer exists." };

  const emailResult = await sendEmail({
    to: order.email,
    subject: `Update on your order ${formatOrderNumber(order.orderNumber)}`,
    text: `Hi ${order.firstName}, your order ${formatOrderNumber(order.orderNumber)} is now: ${customerStatusLabel(order.status)}.`,
  });
  if (!emailResult.sent) return { success: false, error: EMAIL_NOT_CONFIGURED_ERROR };

  return withAuditedMutation(
    "orders:edit",
    { action: "order.resend_status_email", entityType: "Order" },
    async () => {
      revalidatePath(`/admin/orders/${id}`);
      return { result: { success: true as const }, entityId: id, metadata: { to: order.email } };
    }
  );
}
