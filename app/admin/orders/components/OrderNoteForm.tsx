"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/Toast";
import { addOrderNote } from "@/app/admin/orders/[id]/actions";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addOrderNote(orderId, { note });
      if (result.success) {
        setNote("");
        toast({ variant: "success", title: "Note added" });
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isPending}
        placeholder="Add an internal note…"
        rows={3}
        maxLength={2000}
        aria-label="Internal note"
        className="w-full text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg px-3 py-2 outline-none focus:border-admin-accent disabled:opacity-50 resize-none"
      />
      {error && (
        <p role="alert" className="text-xs text-admin-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || note.trim().length === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Add note
        </button>
      </div>
    </form>
  );
}
