"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { useAdminTheme } from "@/components/admin/layout/AdminThemeProvider";
import { adminLogout } from "@/app/admin/actions";

type Command = {
  id: string;
  label: string;
  group: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toggleTheme } = useAdminTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = ADMIN_NAV.filter((item) => item.implemented).map((item) => ({
      id: `nav:${item.href}`,
      label: `Go to ${item.label}`,
      group: "Navigate",
      run: () => router.push(item.href),
    }));

    // Once Products/Orders/Customers modules exist, module-contributed
    // results (e.g. "Go to product: Overshirt") get merged in here,
    // likely via a debounced call to /api/admin/search. Static commands
    // stay client-side regardless — no need for a round-trip to toggle a
    // theme or log out.
    const utilityCommands: Command[] = [
      { id: "util:theme", label: "Toggle theme", group: "Preferences", run: toggleTheme },
      { id: "util:logout", label: "Log out", group: "Account", run: () => adminLogout() },
    ];

    return [...navCommands, ...utilityCommands];
  }, [router, toggleTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Genuinely imperative (DOM focus), not a state reset — stays an effect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function runActive() {
    const command = filtered[activeIndex];
    if (!command) return;
    onOpenChange(false);
    command.run();
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  }

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-[15vh] px-4">
      <button aria-label="Close command palette" className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-lg border border-admin-border bg-admin-surface shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-admin-border px-4">
          <SearchIcon className="w-4 h-4 text-admin-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search…"
            aria-label="Command palette search"
            className="flex-1 bg-transparent py-3.5 text-sm text-admin-fg outline-none placeholder:text-admin-muted"
          />
          <kbd className="text-[10px] text-admin-muted border border-admin-border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-admin-muted text-center">No matching commands.</p>
          ) : (
            Object.entries(groupBy(filtered, (c) => c.group)).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1 text-[11px] uppercase tracking-wide text-admin-muted">{group}</p>
                {items.map((command) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        onOpenChange(false);
                        command.run();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        index === activeIndex ? "bg-admin-accent/10 text-admin-accent" : "text-admin-fg"
                      }`}
                    >
                      {command.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
