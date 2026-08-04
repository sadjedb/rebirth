import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { UserProvider } from "@/lib/user-context";

/**
 * Type system (self-hosted via @fontsource — no runtime Google Fonts
 * dependency, which also improves TTFB/CLS versus a CDN font fetch):
 * - Instrument Serif: storefront display face only. Admin does not use it.
 * - Manrope: body/UI grotesk, used by both storefront and admin.
 * - IBM Plex Mono: utility face for prices, product codes, labels — also
 *   doubles as the admin's monospace face (e.g. order IDs, timestamps).
 */
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.description,
  metadataBase: new URL(`https://${brand.domain}`),
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    siteName: brand.fullName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
};

/**
 * Root layout is intentionally minimal. It exists only for what's truly
 * shared by both the storefront and the admin: the <html> shell, fonts,
 * and session/user identity (UserProvider — reused by the admin's own
 * UserMenu, not a storefront-specific concept). Everything with a brand
 * opinion (Nav, Footer, cart, blossom backdrop) lives one level down in
 * app/(storefront)/layout.tsx, and the admin has its own separate layout
 * entirely — see app/admin/layout.tsx.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-washi text-sumi">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
