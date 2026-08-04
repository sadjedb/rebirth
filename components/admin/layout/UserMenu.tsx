"use client";

import { useState } from "react";
import type { PublicUser } from "@/lib/users";
import { Badge } from "@/components/admin/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { adminLogout } from "@/app/admin/actions";

export function UserMenu({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-admin-surface-hover transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-accent text-admin-accent-fg text-xs font-medium">
          {initials}
        </span>
      </button>

      {open && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-[70] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-admin-border bg-admin-surface shadow-lg z-[80] py-1.5"
          >
            <div className="px-3 py-2 border-b border-admin-border">
              <p className="text-sm font-medium text-admin-fg truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-admin-muted truncate mt-0.5">{user.email}</p>
              <div className="mt-1.5">
                <Badge variant="accent">{user.role.replace("_", " ")}</Badge>
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirmingLogout(true);
              }}
              className="w-full text-left px-3 py-2 text-sm text-admin-fg hover:bg-admin-surface-hover transition-colors"
            >
              Log out
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out of admin?"
        description="You'll need to sign in again to access the dashboard."
        confirmLabel="Log out"
        variant="danger"
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          adminLogout();
        }}
      />
    </div>
  );
}
