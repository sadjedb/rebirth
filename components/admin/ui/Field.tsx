import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-admin-fg mb-1.5">
        {label}
        {required && <span className="text-admin-danger ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-admin-muted mt-1">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-admin-danger mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 text-sm rounded-md border bg-admin-bg text-admin-fg outline-none transition-colors focus:border-admin-accent ${
    hasError ? "border-admin-danger" : "border-admin-border"
  }`;
