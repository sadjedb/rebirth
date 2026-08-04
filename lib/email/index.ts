import "server-only";
import type { EmailMessage, EmailSendResult, EmailProvider } from "@/lib/email/types";

export type { EmailMessage, EmailSendResult } from "@/lib/email/types";

/**
 * No provider is wired up yet — intentionally, not an oversight. This
 * project has no email-sending infrastructure today (no API keys, no
 * provider account, nothing in .env.example for it). When one is added,
 * implement EmailProvider in a new providers/<name>.ts file and assign it
 * here, exactly the way lib/media/index.ts wires up Cloudinary. Every
 * caller already goes through sendEmail() below and already handles the
 * `{ sent: false, reason: "not_configured" }` result, so wiring a real
 * provider in later requires no changes to any calling code.
 */
const provider: EmailProvider | null = null;

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  if (!provider) return { sent: false, reason: "not_configured" };
  await provider.send(message);
  return { sent: true };
}
