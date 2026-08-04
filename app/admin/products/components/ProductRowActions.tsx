"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { deleteProduct, restoreProduct, permanentlyDeleteProduct } from "@/app/admin/products/[id]/actions";

export function ProductRowActions({
  productId,
  productName,
  trashView,
  canDelete,
  canRestore,
  canPermanentlyDelete,
}: {
  productId: string;
  productName: string;
  trashView: boolean;
  canDelete: boolean;
  canRestore: boolean;
  canPermanentlyDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingPermanent, setConfirmingPermanent] = useState(false);

  function runDelete() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      setConfirmingDelete(false);
      if (result.success) {
        toast({ variant: "success", title: "Product moved to trash" });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't delete product", description: result.error });
      }
    });
  }

  function runRestore() {
    startTransition(async () => {
      const result = await restoreProduct(productId);
      if (result.success) {
        toast({ variant: "success", title: "Product restored" });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't restore product", description: result.error });
      }
    });
  }

  function runPermanentlyDelete() {
    startTransition(async () => {
      const result = await permanentlyDeleteProduct(productId);
      setConfirmingPermanent(false);
      if (result.success) {
        toast({ variant: "success", title: "Product permanently deleted" });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't delete product", description: result.error });
      }
    });
  }

  if (trashView) {
    return (
      <div className="flex items-center gap-3">
        {canRestore && (
          <button
            type="button"
            disabled={isPending}
            onClick={runRestore}
            className="text-xs text-admin-accent hover:underline disabled:opacity-50"
          >
            Restore
          </button>
        )}
        {canPermanentlyDelete && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingPermanent(true)}
              className="text-xs text-admin-danger hover:underline disabled:opacity-50"
            >
              Delete forever
            </button>
            <ConfirmDialog
              open={confirmingPermanent}
              title="Permanently delete this product?"
              description="This cannot be undone. The product, its media, and its organization associations will be permanently removed. Order history referencing it is unaffected."
              confirmLabel="Delete forever"
              variant="danger"
              requireTextMatch={productName}
              onCancel={() => setConfirmingPermanent(false)}
              onConfirm={runPermanentlyDelete}
            />
          </>
        )}
      </div>
    );
  }

  if (!canDelete) return null;

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmingDelete(true)}
        className="text-xs text-admin-muted hover:text-admin-danger transition-colors disabled:opacity-50"
      >
        Delete
      </button>
      <ConfirmDialog
        open={confirmingDelete}
        title="Move this product to trash?"
        description="It will disappear from the storefront and this list. You can restore it from the trash at any time."
        confirmLabel="Move to trash"
        variant="danger"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={runDelete}
      />
    </div>
  );
}
