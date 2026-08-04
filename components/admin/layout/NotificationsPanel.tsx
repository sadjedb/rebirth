"use client";

import { useState } from "react";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-admin-muted hover:bg-admin-surface-hover hover:text-admin-fg transition-colors"
      >
        <BellIcon className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <>
          <button
            aria-label="Close notifications"
            className="fixed inset-0 z-[70] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-admin-border bg-admin-surface shadow-lg z-[80]"
          >
            <div className="px-4 py-3 border-b border-admin-border">
              <p className="text-sm font-medium text-admin-fg">Notifications</p>
            </div>
            <EmptyState
              icon={<BellIcon className="w-6 h-6" />}
              title="No notifications yet"
              description="Low stock alerts, new orders, and account activity will show up here once those modules are live."
            />
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
    </svg>
  );
}
