import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: `Create account — ${brand.name}`,
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <PageShell eyebrow="Account" title="Create account" maxWidth="max-w-md">
      <SignupForm />
    </PageShell>
  );
}
