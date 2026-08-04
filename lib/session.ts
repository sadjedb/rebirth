import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getUserById, type PublicUser } from "@/lib/users";

const COOKIE_NAME = "mono_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * ⚠️ DEV-ONLY FALLBACK SECRET.
 * In production this MUST come from a real environment variable — set
 * SESSION_SECRET (32+ random bytes) before deploying. Falling back to a
 * hardcoded string means anyone could forge session tokens.
 */
const secretValue = process.env.SESSION_SECRET;
if (!secretValue && process.env.NODE_ENV === "production") {
  console.warn(
    "[auth] SESSION_SECRET is not set. Falling back to an insecure default — " +
      "set a real SESSION_SECRET env var before this goes live."
  );
}
const secret = new TextEncoder().encode(secretValue || "dev-insecure-secret-change-me");

export async function createSessionCookie(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Reads and verifies the session cookie, returning the current user or null. */
export async function getSession(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    return await getUserById(userId);
  } catch {
    // Expired or tampered token — treat as logged out rather than erroring.
    return null;
  }
}
