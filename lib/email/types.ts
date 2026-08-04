export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain text body. HTML templates are a later module's concern, once
   *  a provider (and a templating approach) is actually chosen. */
  text: string;
};

export type EmailSendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" };

/**
 * Every email provider (Resend/SES/Postmark/etc., whenever one is
 * chosen) implements this. Nothing outside lib/email/ should import a
 * provider file directly or reference a provider-specific concept — only
 * this interface and the functions in lib/email/index.ts. Mirrors
 * lib/media/types.ts's MediaProvider shape.
 */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
