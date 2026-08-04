"use server";

import { contactSchema, submitContactMessage } from "@/lib/contact-messages";

export type ContactResult =
  | { success: true }
  | { success: false; fieldErrors: Partial<Record<string, string>> };

export async function sendContactMessage(raw: Record<string, string>): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, fieldErrors };
  }

  await submitContactMessage(parsed.data);
  return { success: true };
}
