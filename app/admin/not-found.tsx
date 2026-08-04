import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div
      data-admin-theme="light"
      className="min-h-screen flex items-center justify-center bg-admin-bg px-6"
    >
      <div className="text-center max-w-sm">
        <p className="text-sm font-mono text-admin-muted mb-2">404</p>
        <h1 className="text-lg font-semibold text-admin-fg mb-2">Page not found</h1>
        <p className="text-sm text-admin-muted mb-6">
          This admin page doesn&apos;t exist, or hasn&apos;t been built yet.
        </p>
        <Link
          href="/admin"
          className="inline-block px-4 py-2 text-sm rounded-md bg-admin-accent text-admin-accent-fg hover:opacity-90 transition-opacity"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
