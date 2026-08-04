"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/app/(storefront)/signup/actions";

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [isPending, startTransition] = useTransition();

  function handleChange(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await signup(values);
      if (result.success) {
        router.push("/account");
      } else {
        setFieldErrors(result.fieldErrors);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
            First name
          </label>
          <input
            id="firstName"
            autoComplete="given-name"
            value={values.firstName ?? ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
              fieldErrors.firstName ? "border-shu" : "border-stone/30"
            }`}
          />
          {fieldErrors.firstName && <p className="text-xs text-shu mt-1.5">{fieldErrors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
            Last name
          </label>
          <input
            id="lastName"
            autoComplete="family-name"
            value={values.lastName ?? ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
              fieldErrors.lastName ? "border-shu" : "border-stone/30"
            }`}
          />
          {fieldErrors.lastName && <p className="text-xs text-shu mt-1.5">{fieldErrors.lastName}</p>}
        </div>
      </div>

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
          autoComplete="new-password"
          value={values.password ?? ""}
          onChange={(e) => handleChange("password", e.target.value)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.password ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.password && <p className="text-xs text-shu mt-1.5">{fieldErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword ?? ""}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.confirmPassword ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-shu mt-1.5">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-sumi text-washi py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors disabled:opacity-50"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-stone text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-sumi underline hover:no-underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
