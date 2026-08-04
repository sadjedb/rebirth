import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Log in — ${brand.name}`,
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <PageShell eyebrow="Account" title="Log in" maxWidth="max-w-md">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
