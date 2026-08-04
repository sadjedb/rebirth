"use client";

import { useEffect, useRef, useState } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  /** When set, the confirm button stays disabled until the admin types
   *  this exact text — the extra friction irreversible actions (permanent
   *  delete) should have, that a plain click-through confirm doesn't
   *  provide. */
  requireTextMatch?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  requireTextMatch,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [typedText, setTypedText] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTypedText("");
  }

  useEffect(() => {
    if (!open) return;
    // Genuinely imperative (DOM focus), not a state reset.
    if (requireTextMatch) {
      textInputRef.current?.focus();
    } else {
      confirmRef.current?.focus();
    }
  }, [open, requireTextMatch]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmDisabled = Boolean(requireTextMatch) && typedText !== requireTextMatch;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm rounded-lg border border-admin-border bg-admin-surface p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-sm font-semibold text-admin-fg">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-admin-muted mt-2 leading-relaxed">{description}</p>
        )}

        {requireTextMatch && (
          <div className="mt-4">
            <label htmlFor="confirm-text-match" className="block text-xs text-admin-muted mb-1.5">
              Type <span className="font-mono text-admin-fg">{requireTextMatch}</span> to confirm
            </label>
            <input
              ref={textInputRef}
              id="confirm-text-match"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-admin-border bg-admin-bg text-admin-fg outline-none focus:border-admin-accent"
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-md border border-admin-border text-admin-fg hover:bg-admin-surface-hover transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className={`px-3 py-2 text-sm rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-admin-danger text-white hover:opacity-90"
                : "bg-admin-accent text-admin-accent-fg hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
