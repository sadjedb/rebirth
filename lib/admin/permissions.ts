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
  | "customers:view";

/**
 * Role → capability lookup. This is the ONLY place role/capability logic
 * lives. When granular per-user permissions are needed later, `can()`
 * changes to check a permission-override table first and fall back to
 * this map — every `can(user, "x:y")` call site in the app stays
 * identical.
 */
const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  CUSTOMER: [],
  STAFF: ["admin:access", "dashboard:view", "products:view", "orders:view", "customers:view"],
  MANAGER: [
    "admin:access",
    "dashboard:view",
    "products:view",
    "products:create",
    "products:edit",
    "orders:view",
    "orders:edit",
    "customers:view",
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
