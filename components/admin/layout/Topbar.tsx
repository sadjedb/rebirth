"use client";

import type { PublicUser } from "@/lib/users";
import { useAdminTheme } from "@/components/admin/layout/AdminThemeProvider";
import { NotificationsPanel } from "@/components/admin/layout/NotificationsPanel";
import { UserMenu } from "@/components/admin/layout/UserMenu";

export function Topbar({
  user,
  onOpenSearch,
}: {
  user: PublicUser;
  onOpenSearch: () => void;
}) {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <header className="h-14 shrink-0 border-b border-admin-border bg-admin-bg flex items-center gap-4 px-4">
      <div className="flex-1 min-w-0" />

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden sm:flex items-center gap-2 rounded-md border border-admin-border px-3 py-1.5 text-sm text-admin-muted hover:border-admin-accent/50 transition-colors"
      >
        <SearchIcon className="w-3.5 h-3.5" />
        <span>Search…</span>
        <kbd className="ml-4 text-[10px] border border-admin-border rounded px-1.5 py-0.5">
          {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search"
        className="sm:hidden flex h-8 w-8 items-center justify-center rounded-md text-admin-muted hover:bg-admin-surface-hover transition-colors"
      >
        <SearchIcon className="w-[18px] h-[18px]" />
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        className="flex h-8 w-8 items-center justify-center rounded-md text-admin-muted hover:bg-admin-surface-hover hover:text-admin-fg transition-colors"
      >
        {theme === "light" ? <MoonIcon className="w-[18px] h-[18px]" /> : <SunIcon className="w-[18px] h-[18px]" />}
      </button>

      <NotificationsPanel />
      <UserMenu user={user} />
    </header>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}
