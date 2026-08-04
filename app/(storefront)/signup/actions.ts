"use server";

import { signupSchema, createUser } from "@/lib/users";
import { createSessionCookie } from "@/lib/session";

export type SignupResult =
  | { success: true }
  | { success: false; fieldErrors: Partial<Record<string, string>> };

export async function signup(raw: Record<string, string>): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(raw);

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

  const user = await createUser(parsed.data);
  if (!user) {
    return { success: false, fieldErrors: { email: "An account with this email already exists" } };
  }

  await createSessionCookie(user.id);
  return { success: true };
}
