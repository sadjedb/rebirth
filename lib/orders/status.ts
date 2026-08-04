import type { OrderStatus, PaymentStatus, FulfillmentStatus, PaymentMethod } from "@prisma/client";

/**
 * Display metadata for the three independent order status dimensions
 * (see the Module 2 Phase 1 architecture notes for why they're separate).
 *
 * This section holds label/badge-color metadata only, for the List and
 * Detail views' status columns/badges. Transition rules, timestamp side
 * effects, and audit payloads — the single transition-configuration
 * mechanism approved for Module 2 — live further down in this same file
 * (Phase 5), mirroring how lib/products/status.ts holds both concerns
 * together in one place.
 */

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string }> = {
  PENDING: { label: "Pending" },
  PROCESSING: { label: "Processing" },
  COMPLETED: { label: "Completed" },
  CANCELLED: { label: "Cancelled" },
};

export const ORDER_STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  "neutral" | "accent" | "success" | "danger"
> = {
  PENDING: "neutral",
  PROCESSING: "accent",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "FAILED",
];

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string }> = {
  PENDING: { label: "Pending" },
  PAID: { label: "Paid" },
  PARTIALLY_REFUNDED: { label: "Partially refunded" },
  REFUNDED: { label: "Refunded" },
  FAILED: { label: "Failed" },
};

export const PAYMENT_STATUS_BADGE_VARIANT: Record<
  PaymentStatus,
  "neutral" | "success" | "warning" | "danger"
> = {
  PENDING: "neutral",
  PAID: "success",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED: "warning",
  FAILED: "danger",
};

export const FULFILLMENT_STATUSES: readonly FulfillmentStatus[] = [
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
];

export const FULFILLMENT_STATUS_META: Record<FulfillmentStatus, { label: string }> = {
  UNFULFILLED: { label: "Unfulfilled" },
  PARTIALLY_FULFILLED: { label: "Partially fulfilled" },
  FULFILLED: { label: "Fulfilled" },
};

export const FULFILLMENT_STATUS_BADGE_VARIANT: Record<
  FulfillmentStatus,
  "neutral" | "warning" | "success"
> = {
  UNFULFILLED: "neutral",
  PARTIALLY_FULFILLED: "warning",
  FULFILLED: "success",
};

/**
 * Only CASH_ON_DELIVERY exists today (see the PaymentMethod enum's doc
 * comment in schema.prisma). Originally kept local to PaymentCard.tsx
 * with a note to promote it here once a second consumer needed the same
 * labels — CustomerServiceCard's copy-payment-info action is that second
 * consumer.
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on delivery",
};

// =============================================================================
// Status transitions (Phase 5) — the piece deferred from Phase 2/3.
//
// This is the single mechanism every Order status mutation goes through —
// single-record actions today (app/admin/orders/[id]/actions.ts), bulk
// actions in Phase 7. Nothing outside this file decides whether a
// transition is legal, what timestamp it stamps, or what gets audited.
// Mirrors lib/products/status.ts's canTransitionTo/getStatusRequirements
// shape, extended for three independent dimensions instead of one: each
// dimension gets its own transition table (they have different enums, so
// one shared table isn't possible), but all three are resolved through
// the same resolveTransition() function below rather than three separate,
// independently-written pieces of if/else logic.
// =============================================================================

type TimestampField = "paidAt" | "completedAt" | "cancelledAt";

type TransitionRule<TStatus extends string> = {
  /** Statuses this value may be legally reached FROM. Empty means it's
   *  only ever the value an order starts with — not reachable via a
   *  transition at all. */
  from: readonly TStatus[];
  /** Stamped with `new Date()` on the Order row when this transition
   *  fires — the timestamp side effect lives here, in the same place as
   *  the legality rule, instead of being applied separately by whichever
   *  action happens to trigger it. */
  timestampField?: TimestampField;
};

export type OrderStatusDimension = "status" | "paymentStatus" | "fulfillmentStatus";

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, TransitionRule<OrderStatus>> = {
  PENDING: { from: [] },
  PROCESSING: { from: ["PENDING"] },
  COMPLETED: { from: ["PROCESSING"], timestampField: "completedAt" },
  // Not reachable from COMPLETED — a completed order needs a refund, not
  // a cancellation. That's a future module's territory (see the Phase 1
  // architecture notes); conflating the two here would be the wrong
  // precedent to set.
  CANCELLED: { from: ["PENDING", "PROCESSING"], timestampField: "cancelledAt" },
};

const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, TransitionRule<PaymentStatus>> = {
  PENDING: { from: [] },
  PAID: { from: ["PENDING", "FAILED"], timestampField: "paidAt" },
  FAILED: { from: ["PENDING"] },
  PARTIALLY_REFUNDED: { from: ["PAID"] },
  REFUNDED: { from: ["PAID", "PARTIALLY_REFUNDED"] },
};

const FULFILLMENT_STATUS_TRANSITIONS: Record<FulfillmentStatus, TransitionRule<FulfillmentStatus>> = {
  UNFULFILLED: { from: [] },
  PARTIALLY_FULFILLED: { from: ["UNFULFILLED"] },
  FULFILLED: { from: ["UNFULFILLED", "PARTIALLY_FULFILLED"] },
};

const TRANSITION_AUDIT_ACTIONS: Record<OrderStatusDimension, string> = {
  status: "order.status_changed",
  paymentStatus: "order.payment_status_changed",
  fulfillmentStatus: "order.fulfillment_status_changed",
};

const DIMENSION_LABELS: Record<OrderStatusDimension, string> = {
  status: "order status",
  paymentStatus: "payment status",
  fulfillmentStatus: "fulfillment status",
};

export type OrderTransitionResult<TStatus extends string, TField extends string> =
  | {
      ok: true;
      /** Merge directly into the Order.update `data`. Empty for a
       *  same-value no-op transition. */
      data: Partial<Record<TField, TStatus | Date>>;
      /** Null for a no-op — nothing changed, so there's nothing to audit
       *  (saving a record without touching this dimension must never
       *  write a redundant audit entry). */
      audit: {
        action: string;
        metadata: { field: OrderStatusDimension; from: TStatus; to: TStatus };
      } | null;
    }
  | { ok: false; error: string };

function resolveTransition<TStatus extends string, TField extends string>(
  dimension: OrderStatusDimension,
  table: Record<TStatus, TransitionRule<TStatus>>,
  from: TStatus,
  to: TStatus
): OrderTransitionResult<TStatus, TField> {
  if (from === to) return { ok: true, data: {}, audit: null };

  const rule = table[to];
  if (!rule.from.includes(from)) {
    return { ok: false, error: `Can't change ${DIMENSION_LABELS[dimension]} from ${from} to ${to}.` };
  }

  const data: Partial<Record<TField, TStatus | Date>> = {
    [dimension]: to,
  } as Partial<Record<TField, TStatus | Date>>;
  if (rule.timestampField) {
    (data as Record<string, TStatus | Date>)[rule.timestampField] = new Date();
  }

  return {
    ok: true,
    data,
    audit: {
      action: TRANSITION_AUDIT_ACTIONS[dimension],
      metadata: { field: dimension, from, to },
    },
  };
}

export function resolveOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): OrderTransitionResult<OrderStatus, "status" | "completedAt" | "cancelledAt"> {
  return resolveTransition("status", ORDER_STATUS_TRANSITIONS, from, to);
}

export function resolveOrderPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus
): OrderTransitionResult<PaymentStatus, "paymentStatus" | "paidAt"> {
  return resolveTransition("paymentStatus", PAYMENT_STATUS_TRANSITIONS, from, to);
}

export function resolveOrderFulfillmentStatusTransition(
  from: FulfillmentStatus,
  to: FulfillmentStatus
): OrderTransitionResult<FulfillmentStatus, "fulfillmentStatus"> {
  return resolveTransition("fulfillmentStatus", FULFILLMENT_STATUS_TRANSITIONS, from, to);
}

/**
 * Cross-field precondition for the one transition that depends on more
 * than its own dimension: completing an order requires payment to be
 * settled and everything fulfilled. Mirrors getStatusRequirements in
 * lib/products/status.ts — called the same way regardless of target
 * status, so a future requirement on a different transition slots in
 * without changing any call site.
 */
export function getOrderCompletionRequirements(order: {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}): string[] {
  const errors: string[] = [];
  if (order.paymentStatus !== "PAID") {
    errors.push("Payment must be marked Paid before completing this order.");
  }
  if (order.fulfillmentStatus !== "FULFILLED") {
    errors.push("All items must be fulfilled before completing this order.");
  }
  return errors;
}

/**
 * All statuses legally reachable from `from`, plus `from` itself (so a
 * select showing the current value never has to special-case it as
 * "missing" from its own option list). Mirrors getAllowedTransitions in
 * lib/products/status.ts. Derived from the same transition tables above —
 * there's no separate allow-list to fall out of sync with them.
 */
function allowedTransitionsFrom<TStatus extends string>(
  all: readonly TStatus[],
  table: Record<TStatus, TransitionRule<TStatus>>,
  from: TStatus
): readonly TStatus[] {
  return all.filter((status) => status === from || table[status].from.includes(from));
}

export function getAllowedOrderStatusTransitions(from: OrderStatus): readonly OrderStatus[] {
  return allowedTransitionsFrom(ORDER_STATUSES, ORDER_STATUS_TRANSITIONS, from);
}

export function getAllowedPaymentStatusTransitions(from: PaymentStatus): readonly PaymentStatus[] {
  return allowedTransitionsFrom(PAYMENT_STATUSES, PAYMENT_STATUS_TRANSITIONS, from);
}

export function getAllowedFulfillmentStatusTransitions(
  from: FulfillmentStatus
): readonly FulfillmentStatus[] {
  return allowedTransitionsFrom(FULFILLMENT_STATUSES, FULFILLMENT_STATUS_TRANSITIONS, from);
}
