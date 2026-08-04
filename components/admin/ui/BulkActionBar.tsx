"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";

export type BulkActionResult =
  | { successCount: number; skipped: { id: string; reason: string }[] }
  | { success: false; error: string };

export type BulkAction = {
  id: string;
  label: string;
  variant?: "default" | "danger";
  confirm?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    /** Computed from the selection count — e.g. count => `DELETE ${count} PRODUCTS`. */
    requireTextMatch?: (count: number) => string;
  };
  run: (selectedIds: string[]) => Promise<BulkActionResult>;
};

/**
 * The reusable bulk-action bar every module's DataTable integration uses.
 * Server-side eligibility (which selected rows can actually receive the
 * action) is the action's own concern — reported back via `skipped` and
 * surfaced here as a clear toast, not decided in this component.
 */
export function BulkActionBar({
  selectedIds,
  actions,
}: {
  selectedIds: string[];
  actions: BulkAction[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<BulkAction | null>(null);

  async function execute(action: BulkAction) {
    setPendingActionId(action.id);
    const result = await action.run(selectedIds);
    setPendingActionId(null);
    setConfirmingAction(null);

    if (!("successCount" in result)) {
      toast({ variant: "error", title: `Couldn't ${action.label.toLowerCase()}`, description: result.error });
      router.refresh();
      return;
    }

    const { successCount, skipped } = result;
    if (successCount > 0) {
      toast({
        variant: "success",
        title: `${action.label}: ${successCount} product${successCount === 1 ? "" : "s"}`,
        description:
          skipped.length > 0
            ? `${skipped.length} skipped — ${skipped[0].reason}${skipped.length > 1 ? ` (+${skipped.length - 1} more)` : ""}`
            : undefined,
      });
    } else {
      toast({
        variant: "error",
        title: `Nothing to ${action.label.toLowerCase()}`,
        description: skipped[0]?.reason,
      });
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-admin-border bg-admin-accent/5">
      <p className="text-sm text-admin-fg font-medium">{selectedIds.length} selected</p>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={pendingActionId !== null}
            onClick={() => (action.confirm ? setConfirmingAction(action) : execute(action))}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 ${
              action.variant === "danger"
                ? "text-admin-danger hover:bg-admin-danger/10"
                : "text-admin-fg hover:bg-admin-surface-hover"
            }`}
          >
            {pendingActionId === action.id ? "Working…" : action.label}
          </button>
        ))}
      </div>

      {confirmingAction && (
        <ConfirmDialog
          open
          title={confirmingAction.confirm!.title}
          description={confirmingAction.confirm!.description}
          confirmLabel={confirmingAction.confirm!.confirmLabel ?? confirmingAction.label}
          variant={confirmingAction.variant === "danger" ? "danger" : "default"}
          requireTextMatch={confirmingAction.confirm!.requireTextMatch?.(selectedIds.length)}
          onCancel={() => setConfirmingAction(null)}
          onConfirm={() => execute(confirmingAction)}
        />
      )}
    </div>
  );
}
