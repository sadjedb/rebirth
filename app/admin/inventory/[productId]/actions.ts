"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuditedMutation } from "@/lib/audit";
import { applyManualStockAdjustment } from "@/lib/inventory/movements";
import { zodIssuesToFieldErrors } from "@/lib/zod-errors";
import type { Prisma } from "@prisma/client";

const adjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z.coerce.number().int().refine((v) => v !== 0, "Enter a non-zero amount."),
  note: z.string().trim().min(1, "A note is required."),
});

export type AdjustStockResult =
  | { success: true; resultingStock: number }
  | { success: false; fieldErrors?: Partial<Record<string, string>>; formError?: string };

/**
 * Module 6 (Inventory), Phase 3 — the only mutation this phase adds
 * beyond checkout/cancellation. Delta is signed (negative to remove
 * stock, positive to add). No continueSellingOutOfStock exception here:
 * see applyManualStockAdjustment's own doc comment for why a human
 * driving stock negative is always rejected, regardless of that flag.
 */
export async function adjustVariantStock(productId: string, raw: unknown): Promise<AdjustStockResult> {
  const parsed = adjustSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }
  const { variantId, delta, note } = parsed.data;

  return withAuditedMutation<AdjustStockResult>(
    "inventory:adjust",
    { action: "inventory.manual_adjustment", entityType: "ProductVariant" },
    async (user) => {
      const result = await prisma.$transaction((tx: Prisma.TransactionClient) =>
        applyManualStockAdjustment(tx, {
          variantId,
          delta,
          reason: "MANUAL_ADJUSTMENT",
          note,
          actorId: user.id,
          actorEmail: user.email,
        })
      );

      if (!result.ok) {
        // A rejected attempt is still audit-worthy — see the Module 6
        // architecture notes: this isn't a pure input-validation error
        // (like a duplicate slug) that's cheap to check outside a
        // transaction, it's a business-rule outcome that can only be
        // authoritatively determined transactionally. metadata.rejected
        // distinguishes it from a successful adjustment in the audit
        // log/timeline.
        const formError =
          result.reason === "NOT_FOUND"
            ? "This variant no longer exists."
            : "This adjustment would take stock below zero.";
        return {
          result: { success: false as const, formError },
          entityId: variantId,
          metadata: { rejected: true, requestedDelta: delta, reason: result.reason },
        };
      }

      revalidatePath(`/admin/inventory/${productId}`);
      revalidatePath("/admin/inventory");

      return {
        result: { success: true as const, resultingStock: result.resultingStock },
        entityId: variantId,
        metadata: { delta, resultingStock: result.resultingStock, note },
      };
    }
  );
}
