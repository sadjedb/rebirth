import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Messages are now durably stored in Postgres, but still aren't emailed
 * anywhere. Wire this to an email provider (Resend, Postmark, SendGrid) or
 * build an admin view before launch, or submissions go unread.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  topic: z.enum(["order", "product", "wholesale", "press", "other"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function submitContactMessage(input: ContactInput) {
  return prisma.contactMessage.create({ data: input });
}
