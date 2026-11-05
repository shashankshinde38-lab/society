"use server";

import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  SESSION_ABSOLUTE_LIFETIME_MS,
  SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

/**
 * Creates and sets a secure cryptographically signed session cookie
 */
export async function setAdminSession(user: {
  id?: string;
  email: string;
  roleName?: string;
  roleId?: string;
}) {
  const cookieStore = await cookies();
  const now = Date.now();

  const sessionPayload: SessionPayload = {
    userId: user.id || "usr-" + Date.now(),
    email: user.email.trim().toLowerCase(),
    roleName: user.roleName || "Super Admin",
    roleId: user.roleId,
    createdAt: now,
    lastActivity: now,
  };

  const token = await signSessionToken(sessionPayload);

  // Set secure HttpOnly cookie
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(SESSION_ABSOLUTE_LIFETIME_MS / 1000), // 8 hours in seconds
  });

  // Clean up any legacy unencrypted cookie
  try {
    cookieStore.delete(LEGACY_COOKIE_NAME);
  } catch {
    // Ignore error
  }

  return { success: true, user: sessionPayload };
}

/**
 * Destroys server-side session cookies on logout or expiration
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(AUTH_COOKIE_NAME);
  } catch {
    // Ignore error
  }

  try {
    cookieStore.delete(LEGACY_COOKIE_NAME);
  } catch {
    // Ignore error
  }

  return { success: true };
}

/**
 * Server-side session verification.
 * Rejects expired or tampered session tokens.
 */
export async function getVerifiedSession(): Promise<{
  authenticated: boolean;
  user: SessionPayload | null;
  reason?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return { authenticated: false, user: null, reason: "NO_SESSION" };
  }

  const result = await verifySessionToken(token);
  if (!result.valid) {
    // Session token expired or invalid - delete it
    try {
      cookieStore.delete(AUTH_COOKIE_NAME);
    } catch {
      // Ignore
    }
    return { authenticated: false, user: null, reason: result.reason };
  }

  return { authenticated: true, user: result.session };
}

/**
 * Extends the idle timeout sliding window during active usage
 */
export async function touchSessionActivity(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return false;

  const result = await verifySessionToken(token);
  if (!result.valid) {
    try {
      cookieStore.delete(AUTH_COOKIE_NAME);
    } catch {
      // Ignore
    }
    return false;
  }

  const now = Date.now();
  // Only update if at least 1 minute passed to throttle cookie writes
  if (now - result.session.lastActivity > 60 * 1000) {
    const updatedPayload: SessionPayload = {
      ...result.session,
      lastActivity: now,
    };
    const newToken = await signSessionToken(updatedPayload);

    cookieStore.set(AUTH_COOKIE_NAME, newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_ABSOLUTE_LIFETIME_MS / 1000),
    });
  }

  return true;
}

// Backwards-compatible alias for existing code
export async function getAdminSession() {
  const res = await getVerifiedSession();
  return res.authenticated && res.user ? res.user.email : null;
}
