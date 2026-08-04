import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requirePageAccess } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Admin — ${brand.name}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The enforced boundary: every route under /admin passes through this.
  // middleware.ts also checks session presence as a fast-path redirect,
  // but this call — which actually checks the capability, not just
  // "is there a cookie" — is the real security check.
  const user = await requirePageAccess("admin:access");

  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("admin_theme")?.value === "dark" ? "dark" : "light";

  return (
    <AdminShell user={user} initialTheme={initialTheme}>
      {children}
    </AdminShell>
  );
}
