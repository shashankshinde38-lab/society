import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  SESSION_ABSOLUTE_LIFETIME_MS,
  signSessionToken,
  verifySessionToken,
  SessionPayload,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 * Returns the current authenticated session state or 401 if expired
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, reason: "NO_SESSION" },
      { status: 401 }
    );
  }

  const result = await verifySessionToken(token);
  if (!result.valid) {
    const response = NextResponse.json(
      { authenticated: false, reason: result.reason },
      { status: 401 }
    );
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(LEGACY_COOKIE_NAME);
    return response;
  }

  // Session is valid
  const response = NextResponse.json({
    authenticated: true,
    user: {
      userId: result.session.userId,
      email: result.session.email,
      roleName: result.session.roleName,
      roleId: result.session.roleId,
      createdAt: result.session.createdAt,
      lastActivity: result.session.lastActivity,
    },
  });

  // Slide idle window if more than 60 seconds have elapsed
  const now = Date.now();
  if (now - result.session.lastActivity > 60 * 1000) {
    const updatedPayload: SessionPayload = {
      ...result.session,
      lastActivity: now,
    };
    const newToken = await signSessionToken(updatedPayload);
    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_ABSOLUTE_LIFETIME_MS / 1000),
    });
  }

  return response;
}

/**
 * DELETE /api/auth/session
 * Logs out user and destroys server session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(LEGACY_COOKIE_NAME);
  return response;
}
