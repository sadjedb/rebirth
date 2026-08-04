"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/(storefront)/login/actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await login(values, next);
      if (result.success) {
        router.push(result.redirectTo);
      } else {
        setFieldErrors(result.fieldErrors);
        if (result.formError) setFormError(result.formError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={values.email ?? ""}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.email ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.email && <p className="text-xs text-shu mt-1.5">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={values.password ?? ""}
          onChange={(e) => handleChange("password", e.target.value)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.password ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.password && <p className="text-xs text-shu mt-1.5">{fieldErrors.password}</p>}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-shu">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors disabled:opacity-50"
      >
        {isPending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-sm text-stone text-center">
        New here?{" "}
        <Link href="/signup" className="text-sumi underline hover:no-underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
