import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { can, type Capability } from "@/lib/admin/permissions";
import type { PublicUser } from "@/lib/users";

export class AuthorizationError extends Error {
  constructor(message = "You don't have permission to do this.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * For Server Components / pages (layouts, page.tsx). Redirects rather than
 * throwing — a page render can't meaningfully "catch and show an error",
 * navigating away is the only sane response.
 *
 * Not logged in → /login, with a return path.
 * Logged in but lacking the capability → / (storefront home). Deliberately
 * not an /admin/forbidden page: that would either need its own bypass of
 * this same check (redirect loop) or leak the existence/shape of the admin
 * to a logged-in customer who has no business knowing about it.
 */
export async function requirePageAccess(capability: Capability): Promise<PublicUser> {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");
  if (!can(user.role, capability)) redirect("/");
  return user;
}

/**
 * For Server Actions. Throws AuthorizationError instead of redirecting —
 * an action is invoked from a client component that's still on-screen; the
 * caller should catch this and show a toast/error, not lose the page.
 */
export async function assertPermission(capability: Capability): Promise<PublicUser> {
  const user = await getSession();
  if (!user) throw new AuthorizationError("You must be logged in to do this.");
  if (!can(user.role, capability)) throw new AuthorizationError();
  return user;
}

/**
 * Wraps a Server Action body with the permission check + standardized
 * error handling, for actions that check a capability but aren't a data
 * mutation worth auditing (e.g. a read triggered by a POST, or generating
 * an export). For anything that actually creates/updates/deletes business
 * data, use withAuditedMutation (lib/audit.ts) instead — same shape, plus
 * the audit log write your mutation almost certainly needs.
 */
export async function withPermission<T>(
  capability: Capability,
  handler: (user: PublicUser) => Promise<T>
): Promise<T | { success: false; error: string }> {
  try {
    const user = await assertPermission(capability);
    return await handler(user);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Early gate for Server Actions that need to run additional checks
 * (uniqueness, existence, staleness, etc.) before their real work — so an
 * unauthorized caller is rejected before any business-logic queries run,
 * matching the fail-closed order withAuditedBulkMutation already
 * enforces. Returns null when permitted; otherwise the standard failure
 * shape to return immediately.
 *
 *   export async function deleteProduct(id: string) {
 *     const authError = await checkPermission("products:delete");
 *     if (authError) return authError;
 *
 *     const existing = await prisma.product.findFirst(...); // now safe
 *     ...
 *   }
 */
export async function checkPermission(
  capability: Capability
): Promise<{ success: false; error: string } | null> {
  try {
    await assertPermission(capability);
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Like assertPermission, but for actions valid under more than one
 * capability — e.g. uploading product media is legitimate during either
 * Create (products:create) or Edit (products:edit). Centralizing the "at
 * least one of" check here means it's never reimplemented ad hoc per action.
 */
export async function assertAnyPermission(capabilities: Capability[]): Promise<PublicUser> {
  const user = await getSession();
  if (!user) throw new AuthorizationError("You must be logged in to do this.");
  if (!capabilities.some((capability) => can(user.role, capability))) {
    throw new AuthorizationError();
  }
  return user;
}

export async function withAnyPermission<T>(
  capabilities: Capability[],
  handler: (user: PublicUser) => Promise<T>
): Promise<T | { success: false; error: string }> {
  try {
    const user = await assertAnyPermission(capabilities);
    return await handler(user);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
