"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div
      data-admin-theme="light"
      className="min-h-screen flex items-center justify-center bg-admin-bg px-6"
    >
      <div className="text-center max-w-sm">
        <p className="text-sm font-mono text-admin-muted mb-2">Error</p>
        <h1 className="text-lg font-semibold text-admin-fg mb-2">
          Something went wrong loading this page.
        </h1>
        <p className="text-sm text-admin-muted mb-6">
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
