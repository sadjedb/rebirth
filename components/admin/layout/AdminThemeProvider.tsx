"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AdminTheme = "light" | "dark";

type AdminThemeContextValue = {
  theme: AdminTheme;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

const COOKIE_NAME = "admin_theme";

export function AdminThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: AdminTheme;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);

  function toggleTheme() {
    const next: AdminTheme = theme === "light" ? "dark" : "light";
    setTheme(next);
    // Client-side cookie write is enough here — this is a UI preference,
    // not security-sensitive, so it doesn't need a server round-trip.
    // 1 year, readable by the admin layout on next request for SSR.
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-admin-theme={theme} className="min-h-screen bg-admin-bg text-admin-fg">
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return ctx;
}
