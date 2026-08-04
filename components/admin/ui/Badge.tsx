import type { ReactNode } from "react";

type BadgeVariant = "neutral" | "accent" | "success" | "danger" | "warning";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-admin-border/50 text-admin-muted",
  accent: "bg-admin-accent/10 text-admin-accent",
  success: "bg-admin-success/10 text-admin-success",
  danger: "bg-admin-danger/10 text-admin-danger",
  warning: "bg-admin-warning/10 text-admin-warning",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
