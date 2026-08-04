"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { PublicUser } from "@/lib/users";
import { AdminThemeProvider } from "@/components/admin/layout/AdminThemeProvider";
import { AdminToastProvider } from "@/components/admin/ui/Toast";
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Topbar } from "@/components/admin/layout/Topbar";
import { CommandPalette } from "@/components/admin/layout/CommandPalette";

export function AdminShell({
  user,
  initialTheme,
  children,
}: {
  user: PublicUser;
  initialTheme: "light" | "dark";
  children: ReactNode;
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AdminThemeProvider initialTheme={initialTheme}>
      <AdminToastProvider>
        <div className="flex h-screen overflow-hidden font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar user={user} onOpenSearch={() => setCommandPaletteOpen(true)} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      </AdminToastProvider>
    </AdminThemeProvider>
  );
}
