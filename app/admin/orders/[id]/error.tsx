"use client";

import { useEffect } from "react";

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/orders/detail]", error);
  }, [error]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="rounded-lg border border-admin-border bg-admin-surface p-8 text-center">
        <p className="text-sm font-medium text-admin-fg mb-2">Couldn&apos;t load this order.</p>
        <p className="text-sm text-admin-muted mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
