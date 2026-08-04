import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPermission, AuthorizationError } from "@/lib/admin/auth";
import type { PublicUser } from "@/lib/users";
import type { Capability } from "@/lib/admin/permissions";

export type BulkMutationOutcome = {
  /** Ids the mutation actually applied to. */
  affectedIds: string[];
  /** Ids that were selected but ineligible, with a human-readable reason
   *  the UI can show directly (e.g. "Missing category"). */
  skipped?: { id: string; reason: string }[];
};

export type BulkActionSummary = {
  successCount: number;
  skipped: { id: string; reason: string }[];
};

/**
 * The reusable bulk-mutation pattern every module's bulk actions use:
 * check the capability once, run the handler (which performs its own
 * batched query/queries — "avoid N+1 mutations" is the handler's
 * responsibility, not this wrapper's), then write one audit log entry per
 * successfully affected entity in a single createMany call, tagged with a
 * shared batchId so they're traceable as one operation while still
 * showing up correctly in each entity's own history.
 *
 *   export async function bulkArchiveProducts(ids: string[]) {
 *     return withAuditedBulkMutation(
 *       "products:edit",
 *       { action: "product.bulk_archive", entityType: "Product" },
 *       async () => {
 *         const result = await prisma.product.updateMany({
 *           where: { id: { in: ids }, deletedAt: null },
 *           data: { status: "ARCHIVED" },
 *         });
 *         revalidatePath("/admin/products");
 *         return { affectedIds: ids };
 *       }
 *     );
 *   }
 */
export async function withAuditedBulkMutation(
  capability: Capability,
  audit: { action: string; entityType: string },
  handler: (user: PublicUser) => Promise<BulkMutationOutcome>
): Promise<BulkActionSummary | { success: false; error: string }> {
  let user: PublicUser;
  try {
    user = await assertPermission(capability);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  const { affectedIds, skipped = [] } = await handler(user);

  if (affectedIds.length > 0) {
    const batchId = crypto.randomUUID();
    await prisma.auditLog.createMany({
      data: affectedIds.map((id) => ({
        actorId: user.id,
        actorEmail: user.email,
        action: audit.action,
        entityType: audit.entityType,
        entityId: id,
        metadata: { batchId, batchSize: affectedIds.length },
      })),
    });
  }

  return { successCount: affectedIds.length, skipped };
}
