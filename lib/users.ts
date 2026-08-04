import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type { Role };

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  return user;
}

/**
 * Creates a new user. Returns null if the email is already registered
 * (caller is responsible for surfacing that as a field error).
 */
export async function createUser(input: SignupInput): Promise<PublicUser | null> {
  const existing = await getUserByEmail(input.email);
  if (existing) return null;

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      passwordHash,
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  return user;
}

/** Verifies credentials and returns the public user record, or null. */
export async function verifyCredentials(input: LoginInput): Promise<PublicUser | null> {
  const user = await getUserByEmail(input.email);
  if (!user) return null;

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
}
