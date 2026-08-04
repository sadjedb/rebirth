"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { deleteProduct } from "@/app/admin/products/[id]/actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      setConfirming(false);
      if (result.success) {
        toast({ variant: "success", title: "Product moved to trash" });
        router.push("/admin/products");
      } else {
        toast({ variant: "error", title: "Couldn't delete product", description: result.error });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(true)}
        className="px-4 py-2 text-sm rounded-md border border-admin-danger/30 text-admin-danger hover:bg-admin-danger/10 transition-colors disabled:opacity-50"
      >
        Delete
      </button>
      <ConfirmDialog
        open={confirming}
        title="Move this product to trash?"
        description="It will disappear from the storefront and the products list. You can restore it from the trash at any time."
        confirmLabel="Move to trash"
        variant="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
