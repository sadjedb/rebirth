"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/(storefront)/contact/actions";

const topics = [
  { value: "order", label: "Order support" },
  { value: "product", label: "Product question" },
  { value: "wholesale", label: "Wholesale" },
  { value: "press", label: "Press" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [values, setValues] = useState<Record<string, string>>({ topic: "order" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendContactMessage(values);
      if (result.success) {
        setSent(true);
        setValues({ topic: "order" });
      } else {
        setFieldErrors(result.fieldErrors);
      }
    });
  }

  if (sent) {
    return (
      <div className="border border-stone/20 p-8 text-center">
        <p className="font-display italic text-2xl text-sumi mb-2">Message sent.</p>
        <p className="text-sm text-stone">
          We reply within 1–2 business days. Thank you for reaching out.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Name
        </label>
        <input
          id="name"
          value={values.name ?? ""}
          onChange={(e) => handleChange("name", e.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.name ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.name && <p className="text-xs text-shu mt-1.5">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email ?? ""}
          onChange={(e) => handleChange("email", e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi ${
            fieldErrors.email ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.email && <p className="text-xs text-shu mt-1.5">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="topic" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Topic
        </label>
        <select
          id="topic"
          value={values.topic ?? "order"}
          onChange={(e) => handleChange("topic", e.target.value)}
          className="w-full border border-stone/30 bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi"
        >
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-xs uppercase tracking-[0.12em] text-stone mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={values.message ?? ""}
          onChange={(e) => handleChange("message", e.target.value)}
          aria-invalid={Boolean(fieldErrors.message)}
          className={`w-full border bg-transparent px-3 py-3 text-sm text-sumi outline-none focus:border-sumi resize-none ${
            fieldErrors.message ? "border-shu" : "border-stone/30"
          }`}
        />
        {fieldErrors.message && <p className="text-xs text-shu mt-1.5">{fieldErrors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-sumi text-washi px-8 py-4 text-[13px] uppercase tracking-[0.14em] hover:bg-kachi transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
