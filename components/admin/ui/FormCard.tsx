import type { ReactNode } from "react";

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-admin-border bg-admin-bg overflow-hidden">
      <div className="px-5 py-4 border-b border-admin-border">
        <h2 className="text-sm font-semibold text-admin-fg">{title}</h2>
        {description && <p className="text-xs text-admin-muted mt-1">{description}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}
