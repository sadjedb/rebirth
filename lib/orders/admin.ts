import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/admin/url-state";
import type {
  Prisma,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  PaymentMethod,
  CurrencyCode,
  PlacedBy,
  ProductIcon,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderAddress as PrismaOrderAddress,
} from "@prisma/client";

export type AdminOrderFilters = {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

/** Whitelisted — `sort` comes from a URL param, never pass user input
 *  straight into Prisma's orderBy key. `Customer` (firstName/lastName)
 *  and `email` aren't included: there's no column header that exposes a
 *  sort control for them (email is folded into the Customer cell), and a
 *  sortable column nothing in the UI can trigger is exactly the kind of
 *  speculative capability this module is otherwise deliberately avoiding
 *  (see orders:edit/orders:cancel, deferred the same way). */
const SORTABLE_COLUMNS = [
  "orderNumber",
  "total",
  "createdAt",
  "status",
  "paymentStatus",
  "fulfillmentStatus",
] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

function isSortableColumn(value: string | undefined): value is SortableColumn {
  return SORTABLE_COLUMNS.includes(value as SortableColumn);
}

/** "#1042" or "1042" -> 1042; anything that doesn't parse as an integer
 *  returns null so callers can skip the numeric-equality search clause
 *  entirely rather than matching orderNumber: NaN (which Prisma would
 *  reject as invalid input). */
function parseOrderNumberSearch(search: string): number | null {
  const numeric = Number(search.replace(/^#/, ""));
  return Number.isInteger(numeric) ? numeric : null;
}

export async function getAdminOrders(filters: AdminOrderFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = isSortableColumn(filters.sort) ? filters.sort : "createdAt";
  const sortDir = filters.dir === "asc" ? "asc" : "desc";
  const search = filters.search?.trim();
  const orderNumberSearch = search ? parseOrderNumberSearch(search) : null;

  const where: Prisma.OrderWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.fulfillmentStatus ? { fulfillmentStatus: filters.fulfillmentStatus } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            ...(orderNumberSearch !== null ? [{ orderNumber: orderNumberSearch }] : []),
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sortColumn]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    page,
    pageSize,
  };
}

export type AdminOrderListItem = Awaited<ReturnType<typeof getAdminOrders>>["items"][number];

// ---------------------------------------------------------------------------
// Order Detail (Phase 4) — a dedicated view model, not the raw Prisma shape.
// Address rows are split into named `shippingAddress`/`billingAddress`
// fields instead of the generic `addresses: OrderAddress[]` array Prisma
// returns, so components never need to know AddressType exists or search
// the array themselves. This mirrors toOrder() in lib/orders/storefront.ts
// (same kind of mapping, for the customer-facing side) rather than reusing
// it directly — the admin view needs materially more fields (both
// addresses, the full money breakdown, all four lifecycle timestamps,
// placedBy, userId) than a customer receipt does.

export type AdminOrderAddress = {
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type AdminOrderItem = {
  id: string;
  /** null if the product was permanently deleted — every other field here
   *  is a snapshot and stays fully renderable regardless. */
  productId: string | null;
  slug: string;
  name: string;
  code: string;
  sku: string | null;
  price: number;
  discount: number;
  lineTotal: number;
  tone: string;
  icon: ProductIcon;
  size: string;
  quantity: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  userId: string | null;
  placedBy: PlacedBy;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currency: CurrencyCode;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  status: OrderStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  /** null only if data predates the OrderAddress migration and something
   *  went wrong — createOrder always creates one, and Phase 2 backfilled
   *  one for every pre-existing row. Components must still handle null;
   *  see AddressCard. */
  shippingAddress: AdminOrderAddress | null;
  /** null whenever checkout didn't collect a separate billing address —
   *  the common case, not an error. AddressCard renders "Same as
   *  shipping" for this, never a duplicated copy of the shipping fields. */
  billingAddress: AdminOrderAddress | null;
  items: AdminOrderItem[];
};

function toAdminAddress(row: PrismaOrderAddress): AdminOrderAddress {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    company: row.company,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    region: row.region,
    postalCode: row.postalCode,
    country: row.country,
  };
}

function toAdminOrderDetail(
  row: PrismaOrder & { items: PrismaOrderItem[]; addresses: PrismaOrderAddress[] }
): AdminOrderDetail {
  const shipping = row.addresses.find((a: PrismaOrderAddress) => a.type === "SHIPPING");
  const billing = row.addresses.find((a: PrismaOrderAddress) => a.type === "BILLING");

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    placedBy: row.placedBy,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    currency: row.currency,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    taxTotal: row.taxTotal,
    shippingTotal: row.shippingTotal,
    total: row.total,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    paidAt: row.paidAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    shippingAddress: shipping ? toAdminAddress(shipping) : null,
    billingAddress: billing ? toAdminAddress(billing) : null,
    items: row.items.map((item: PrismaOrderItem) => ({
      id: item.id,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      code: item.code,
      sku: item.sku,
      price: item.price,
      discount: item.discount,
      lineTotal: item.lineTotal,
      tone: item.tone,
      icon: item.icon,
      size: item.size,
      quantity: item.quantity,
    })),
  };
}

/**
 * Single order for the Detail page. One query — no Promise.all needed,
 * unlike the Products edit page (which also loads category/collection/tag
 * picker options alongside the product) — Order Detail is read-only, with
 * nothing else to fetch in parallel. Deliberately does NOT join Product:
 * every field ItemsCard displays is already snapshotted on OrderItem, so
 * joining would be pure overfetch for data that's never rendered.
 */
export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: { items: true, addresses: true },
  });
  return row ? toAdminOrderDetail(row) : null;
}
