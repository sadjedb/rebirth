import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPermission, AuthorizationError } from "@/lib/admin/auth";
import type { PublicUser } from "@/lib/users";
import type { Capability } from "@/lib/admin/permissions";

/**
 * A full PublicUser satisfies this (it has `id`/`email`), so every
 * existing withAuditedMutation caller needs no changes. The narrower
 * shape exists for callers with no authenticated staff user at all — e.g.
 * guest checkout, which still needs to write to the same audit trail
 * (AuditLog.actorId is already nullable for exactly this reason).
 */
type LogActivityActor = { id: string | null; email: string };

type LogActivityInput = {
  actor: LogActivityActor;
  action: string; // e.g. "product.create"
  entityType: string; // e.g. "Product"
  entityId: string;
  metadata?: Record<string, unknown>;
};

/** Low-level writer. Prefer withAuditedMutation for actual mutations — this
 * is exported mainly for cases that don't fit that shape (e.g. logging a
 * failed login attempt, which isn't gated by a Capability). */
export async function logActivity(input: LogActivityInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

type AuditedMutationResult<T> = {
  /** Whatever the handler wants to hand back to the client. */
  result: T;
  /** The entity that was created/changed. Comes from the handler's result
   *  rather than being required upfront, since a create action doesn't
   *  know its new row's id until after the insert. */
  entityId: string;
  /** What actually changed — becomes AuditLog.metadata. Keep it small:
   *  changed fields, not full before/after snapshots of large objects. */
  metadata?: Record<string, unknown>;
};

/**
 * The pattern every mutating admin action follows: check the capability,
 * run the mutation, write the audit log, return the result — with a single
 * standardized error shape if any step fails. This is what makes "every
 * mutation writes an audit log" a structural guarantee rather than a
 * convention someone can forget mid-module.
 *
 *   export async function deleteProduct(id: string) {
 *     return withAuditedMutation(
 *       "products:delete",
 *       { action: "product.delete", entityType: "Product" },
 *       async () => {
 *         await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
 *         revalidatePath("/admin/products");
 *         return { result: { success: true as const }, entityId: id };
 *       }
 *     );
 *   }
 *
 *   export async function createProduct(input: CreateProductInput) {
 *     return withAuditedMutation(
 *       "products:create",
 *       { action: "product.create", entityType: "Product" },
 *       async () => {
 *         const product = await prisma.product.create({ data: input });
 *         revalidatePath("/admin/products");
 *         // entityId only exists now, after the insert — that's fine, it's
 *         // read from the result, not required before the handler runs.
 *         return { result: { success: true as const, id: product.id }, entityId: product.id };
 *       }
 *     );
 *   }
 */
export async function withAuditedMutation<T>(
  capability: Capability,
  audit: { action: string; entityType: string },
  handler: (user: PublicUser) => Promise<AuditedMutationResult<T>>
): Promise<T | { success: false; error: string }> {
  try {
    const user = await assertPermission(capability);
    const { result, entityId, metadata } = await handler(user);
    await logActivity({
      actor: user,
      action: audit.action,
      entityType: audit.entityType,
      entityId,
      metadata,
    });
    return result;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
