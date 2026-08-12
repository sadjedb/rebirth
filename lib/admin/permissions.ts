import type { Role } from "@prisma/client";

/** Ascending order — index = rank. Used only by hasMinimumRole(). */
const ROLE_ORDER: Role[] = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"];

/**
 * Every capability any admin module can gate behind. Add to this union as
 * each module is built. The union is the contract every module codes
 * against; ROLE_CAPABILITIES below is the only place that has to know
 * which roles satisfy it.
 */
export type Capability =
  | "admin:access" // can enter /admin at all
  | "dashboard:view"
  | "users:manage" // manage staff accounts and roles (Users & Roles module)
  | "system:manage" // system-level settings (System module)
  | "products:view"
  | "products:create"
  | "products:edit"
  | "products:delete" // soft delete
  | "products:restore"
  | "products:permanently_delete" // hard delete — SUPER_ADMIN only
  | "orders:view"
  | "orders:edit"
  | "orders:cancel"
  | "customers:view"
  | "reviews:view"
  | "reviews:moderate"
  | "coupons:view"
  | "coupons:create"
  | "coupons:edit"
  // Module 6 (Inventory). Only "view" is granted anywhere below for now —
  // this is a read-only Phase 2. "inventory:adjust" and
  // "inventory:manage_warehouses" are named in the approved Module 6
  // architecture but intentionally not added to this union yet: adding an
  // unused capability now would be speculative, and the roadmap's own
  // convention (see Coupons/Reviews) is to introduce each capability in
  // the phase that actually gates something with it.
  | "inventory:view";

/**
 * Role → capability lookup. This is the ONLY place role/capability logic
 * lives. When granular per-user permissions are needed later, `can()`
 * changes to check a permission-override table first and fall back to
 * this map — every `can(user, "x:y")` call site in the app stays
 * identical.
 */
const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  CUSTOMER: [],
  STAFF: [
    "admin:access",
    "dashboard:view",
    "products:view",
    "orders:view",
    "customers:view",
    "reviews:view",
    "coupons:view",
    "inventory:view",
  ],
  MANAGER: [
    "admin:access",
    "dashboard:view",
    "products:view",
    "products:create",
    "products:edit",
    "orders:view",
    "orders:edit",
    "customers:view",
    "reviews:view",
    "reviews:moderate",
    "coupons:view",
    "coupons:create",
    "coupons:edit",
    "inventory:view",
  ],
  ADMIN: [
    "admin:access",
    "dashboard:view",
    "users:manage",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:restore",
    "orders:view",
    "orders:edit",
    "orders:cancel",
    "customers:view",
    "reviews:view",
    "reviews:moderate",
    "coupons:view",
    "coupons:create",
    "coupons:edit",
    "inventory:view",
  ],
  SUPER_ADMIN: [
    "admin:access",
    "dashboard:view",
    "users:manage",
    "system:manage",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:restore",
    "products:permanently_delete",
    "orders:view",
    "orders:edit",
    "orders:cancel",
    "customers:view",
    "reviews:view",
    "reviews:moderate",
    "coupons:view",
    "coupons:create",
    "coupons:edit",
    "inventory:view",
  ],
};

/** The single question every module should ask instead of comparing roles. */
export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/**
 * Coarse "at least this seniority" check, for the rare case a capability
 * genuinely is "any role at or above X" rather than a named permission.
 * Prefer `can()` for anything module-specific.
 */
export function hasMinimumRole(role: Role, minimum: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minimum);
}
