import type { ReactNode } from "react";

/**
 * Read-only label/value pair for display cards (Order Detail and beyond).
 * Deliberately separate from components/admin/ui/Field.tsx — that
 * component renders a real `<label htmlFor>` paired with a form control
 * and carries required/error/hint props; none of that applies to a value
 * with no associated input.
 */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-admin-muted mb-1">{label}</p>
      <div className="text-sm text-admin-fg">{children}</div>
    </div>
  );
}
