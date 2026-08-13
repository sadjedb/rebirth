import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { redeemCouponInTransaction, CouponRedemptionError } from "@/lib/coupons/redemption";
import { decrementVariantStock, recordStockMovement } from "@/lib/inventory/movements";
import type { CartItem } from "@/lib/cart-context";
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderAddress as PrismaOrderAddress,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  Prisma,
} from "@prisma/client";

export { CouponRedemptionError };

/** Module 6 (Inventory), Phase 3. Thrown inside createOrder's
 *  transaction when a line's variant can't be purchased — either it's
 *  gone/inactive, or trackInventory is on, continueSellingOutOfStock is
 *  off, and stock is insufficient. Thrown (not returned), same as
 *  CouponRedemptionError, so it propagates out of prisma.$transaction
 *  and rolls back everything else the transaction did — coupon
 *  redemption, every other line's decrement, the order itself. Never a
 *  partially-fulfilled multi-line order. */
export class OutOfStockError extends Error {
  constructor(public readonly productName: string) {
    super(`${productName} is no longer available in the requested quantity.`);
    this.name = "OutOfStockError";
  }
}

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number"),
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  region: z.string().trim().min(1, "State / region is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  notes: z.string().trim().optional(),
  /** Applied server-side inside createOrder's transaction — see
   *  lib/coupons/redemption.ts. Never trust a discount amount computed
   *  earlier in the request (e.g. from a checkout "apply" preview); only
   *  the code travels from the client, the amount is always recomputed
   *  fresh at order-creation time. */
  couponCode: z.string().trim().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type Order = {
  id: string;
  orderNumber: number;
  userId?: string | null;
  items: CartItem[];
  subtotal: number;
  /** Populated by lib/coupons/redemption.ts when a coupon was applied at
   *  checkout; 0 otherwise. Never negative, never exceeds subtotal. */
  discountTotal: number;
  total: number;
  /** Order's own currency (Phase 2) — always format money against this,
   *  never the store default (brand.currency), the same rule the admin
   *  side follows. See lib/money.ts's formatMoney. */
  currency: string;
  customer: Pick<CheckoutInput, "firstName" | "lastName" | "email" | "phone">;
  shippingAddress: Pick<
    CheckoutInput,
    "addressLine1" | "addressLine2" | "city" | "region" | "postalCode" | "country"
  >;
  notes?: string | null;
  paymentMethod: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
};

// formatOrderNumber/customerStatusLabel moved to lib/orders/format.ts —
// they're pure (no data access), so they belong in a module that's safe
// to import from Client Components, which this "server-only" file isn't.
// Re-exported here so every existing import of these two names (checkout,
// account, confirmation) keeps working unchanged.
export { formatOrderNumber, customerStatusLabel } from "./format";

type OrderRow = PrismaOrder & { items: PrismaOrderItem[]; addresses: PrismaOrderAddress[] };

function toOrder(row: OrderRow): Order {
  const shipping = row.addresses.find((a: PrismaOrderAddress) => a.type === "SHIPPING");
  // Every order has a SHIPPING address by construction (createOrder always
  // creates one, and the Phase 2 migration backfilled one for every
  // pre-existing row) — this is defensive, not an expected null.
  if (!shipping) {
    throw new Error(`Order ${row.id} is missing its shipping address.`);
  }

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    total: row.total,
    currency: row.currency,
    customer: {
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
    },
    shippingAddress: {
      addressLine1: shipping.addressLine1,
      addressLine2: shipping.addressLine2 ?? undefined,
      city: shipping.city,
      region: shipping.region,
      postalCode: shipping.postalCode,
      country: shipping.country,
    },
    notes: row.notes,
    paymentMethod: row.paymentMethod,
    status: row.status,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item: PrismaOrderItem) => ({
      // Coalesced: a permanently-deleted product leaves productId null on
      // historical order rows. Harmless here — display only, never used
      // for cart-style remove/quantity actions the way a live CartItem is.
      productId: item.productId ?? "",
      // Same coalescing for variantId — null on pre-Module-6 orders and
      // on any order whose variant was later deactivated/removed. Also
      // display-only here.
      variantId: item.variantId ?? "",
      slug: item.slug,
      name: item.name,
      code: item.code,
      price: item.price,
      tone: item.tone,
      icon: item.icon,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
  };
}

export async function createOrder(
  input: CheckoutInput,
  items: CartItem[],
  userId?: string
): Promise<Order> {
  if (items.length === 0) {
    throw new Error("Cannot create an order with no items.");
  }

  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))];

  const row = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Resolve every line's variant fresh, inside the transaction — the
    // client is never trusted for price, stock, availability, or variant
    // ownership (Module 6 architecture, Checkout Integration). A cart
    // built from stale/tampered localStorage data fails here before
    // anything is written.
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        productId: true,
        color: true,
        size: true,
        sku: true,
        isActive: true,
        product: {
          select: { id: true, slug: true, name: true, code: true, price: true, tone: true, icon: true },
        },
      },
    });
    const variantById = new Map(variants.map((v) => [v.id, v] as const));

    const resolvedItems = items.map((item) => {
      const variant = variantById.get(item.variantId);
      if (!variant || variant.productId !== item.productId || !variant.isActive) {
        throw new OutOfStockError(item.name);
      }
      return { cartItem: item, variant };
    });

    // Price always comes from the freshly-read Product row, never the
    // client-held cart — see the comment above.
    const subtotal = resolvedItems.reduce(
      (sum, { cartItem, variant }) => sum + variant.product.price * cartItem.quantity,
      0
    );

    // Resolved inside the same transaction as the stock decrement below,
    // even though it doesn't itself need atomicity — keeping the whole
    // "figure out totals, then write the order" sequence in one
    // transaction means a coupon race-loss (thrown by
    // redeemCouponInTransaction) or an out-of-stock line cleanly rolls
    // back everything, not just its own piece.
    let discountTotal = 0;
    let couponId: string | null = null;
    if (input.couponCode) {
      const redemption = await redeemCouponInTransaction(tx, input.couponCode, subtotal);
      discountTotal = redemption.discountAmount;
      couponId = redemption.couponId;
    }

    // subtotal - discountTotal + taxTotal + shippingTotal — taxTotal/
    // shippingTotal still don't exist in this checkout flow (both stay
    // their schema default of 0), same as before coupons existed.
    const total = subtotal - discountTotal;

    const order = await tx.order.create({
      data: {
        userId,
        placedBy: "CUSTOMER",
        currency: "USD",
        subtotal,
        discountTotal,
        couponId,
        total,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        addresses: {
          create: [
            {
              type: "SHIPPING",
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
              addressLine1: input.addressLine1,
              addressLine2: input.addressLine2,
              city: input.city,
              region: input.region,
              postalCode: input.postalCode,
              country: input.country,
            },
          ],
        },
        items: {
          create: resolvedItems.map(({ cartItem, variant }) => ({
            productId: variant.productId,
            variantId: variant.id,
            slug: variant.product.slug,
            name: variant.product.name,
            code: variant.product.code,
            // Sourced from ProductVariant.sku as of Module 6 Phase 3 —
            // Product no longer has its own sku. Field name/shape on
            // OrderItem is unchanged; only the data source moved.
            sku: variant.sku,
            price: variant.product.price,
            lineTotal: variant.product.price * cartItem.quantity,
            tone: variant.product.tone ?? "#E4E0D6",
            icon: variant.product.icon ?? "tee",
            size: variant.size ?? "",
            color: variant.color,
            quantity: cartItem.quantity,
          })),
        },
      },
      include: { items: true, addresses: true },
    });

    // Stock decrement + one StockMovement per line, now that the order
    // (and each OrderItem's variantId) exists. Sequential, not
    // Promise.all: if the same variant appears on two lines in one
    // order, the second decrement must see the first one's committed
    // write, which decrementVariantStock's guarded update only gets
    // right when each call reads the variant fresh immediately before
    // it runs.
    for (const orderItem of order.items) {
      if (!orderItem.variantId) continue; // never happens here — every line above was created with a variantId — but keeps this loop's typing honest.

      const freshVariant = await tx.productVariant.findUniqueOrThrow({
        where: { id: orderItem.variantId },
        select: {
          id: true,
          productId: true,
          stock: true,
          trackInventory: true,
          continueSellingOutOfStock: true,
        },
      });

      const decrement = await decrementVariantStock(tx, freshVariant, orderItem.quantity);
      if (!decrement.ok) {
        // Rolls back the entire transaction — coupon redemption, every
        // other line's decrement, the order itself. Never a
        // partially-fulfilled order.
        throw new OutOfStockError(orderItem.name);
      }

      await recordStockMovement(tx, {
        variantId: freshVariant.id,
        productId: freshVariant.productId,
        quantityDelta: decrement.appliedDelta,
        resultingStock: decrement.resultingStock,
        reason: "ORDER_PLACED",
        orderId: order.id,
      });
    }

    return order;
  });

  // Not withAuditedMutation — this isn't an admin action gated by a
  // Capability, it's a public checkout flow a guest can trigger with no
  // staff user at all. logActivity's actor shape (id: string | null)
  // exists specifically for this case; see lib/audit.ts.
  await logActivity({
    actor: { id: userId ?? null, email: input.email },
    action: "order.create",
    entityType: "Order",
    entityId: row.id,
    metadata: { orderNumber: row.orderNumber, total: row.total, itemCount: row.items.length },
  });

  return toOrder(row);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: { items: true, addresses: true },
  });
  return row ? toOrder(row) : null;
}

/** Returns a user's orders, most recent first. */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: { items: true, addresses: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}
