"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, type NavItem } from "@/lib/admin/nav";
import { brand } from "@/config/brand";

const COLLAPSE_STORAGE_KEY = "admin:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () =>
      new Set(
        ADMIN_NAV.filter((item) => item.children?.some((child) => isActive(child.href))).map(
          (item) => item.label
        )
      )
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available client-side; this hydrates a cosmetic preference after mount and cannot be done via a lazy initializer without causing an SSR/client hydration mismatch.
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <aside
      className={`shrink-0 border-r border-admin-border bg-admin-surface flex flex-col transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="h-14 flex items-center px-4 border-b border-admin-border">
        {collapsed ? (
          <span className="font-mono text-sm font-semibold text-admin-fg">
            {brand.name.slice(0, 1)}
          </span>
        ) : (
          <span className="font-mono text-sm font-semibold text-admin-fg tracking-wide">
            {brand.name} <span className="text-admin-muted font-normal">admin</span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Admin navigation">
        {ADMIN_NAV.map((item) => (
          <NavEntry
            key={item.label}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            open={openGroups.has(item.label)}
            onToggleGroup={() => toggleGroup(item.label)}
          />
        ))}
      </nav>

      <div className="border-t border-admin-border p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center gap-2 rounded-md px-2 py-2 text-admin-muted hover:bg-admin-surface-hover hover:text-admin-fg transition-colors"
        >
          <ChevronIcon className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavEntry({
  item,
  collapsed,
  isActive,
  open,
  onToggleGroup,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  open: boolean;
  onToggleGroup: () => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const active = isActive(item.href);

  if (hasChildren) {
    return (
      <div className="mb-0.5">
        <button
          type="button"
          onClick={onToggleGroup}
          className="w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-admin-muted hover:bg-admin-surface-hover hover:text-admin-fg transition-colors"
        >
          <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
          {collapsed && <span className="text-xs">{item.label.slice(0, 1)}</span>}
          {!collapsed && (
            <ChevronIcon className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-2.5 pl-2.5 border-l border-admin-border flex flex-col">
            {item.children!.map((child) => (
              <NavLink key={child.label} item={child} collapsed={false} active={isActive(child.href)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <NavLink item={item} collapsed={collapsed} active={active} />;
}

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const baseClasses = "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors mb-0.5";

  if (!item.implemented) {
    return (
      <div
        className={`${baseClasses} text-admin-muted/50 cursor-not-allowed justify-between`}
        title="Coming soon"
      >
        <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-wide border border-admin-border rounded px-1.5 py-0.5 shrink-0">
            Soon
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        active
          ? "bg-admin-accent/10 text-admin-accent font-medium"
          : "text-admin-fg hover:bg-admin-surface-hover"
      }`}
    >
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
      {collapsed && <span className="text-xs">{item.label.slice(0, 1)}</span>}
    </Link>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
