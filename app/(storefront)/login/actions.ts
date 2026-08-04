"use server";

import { loginSchema, verifyCredentials } from "@/lib/users";
import { createSessionCookie } from "@/lib/session";
import { can } from "@/lib/admin/permissions";

export type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; fieldErrors: Partial<Record<string, string>>; formError?: string };

/** Only accept an internal path — never redirect off-site (open redirect). */
function safeNextPath(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function login(raw: Record<string, string>, next?: string): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(raw);

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

  const user = await verifyCredentials(parsed.data);
  if (!user) {
    // Deliberately vague — doesn't reveal whether the email exists.
    return { success: false, fieldErrors: {}, formError: "Incorrect email or password." };
  }

  await createSessionCookie(user.id);

  // Staff always land in the admin, regardless of what `next` says — a
  // manager logging in from a `?next=/checkout` link (e.g. a bookmark)
  // should never be dropped into a customer checkout flow.
  const redirectTo = can(user.role, "admin:access") ? "/admin" : safeNextPath(next) ?? "/account";

  return { success: true, redirectTo };
}
