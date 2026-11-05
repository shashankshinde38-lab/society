import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  SESSION_ABSOLUTE_LIFETIME_MS,
  SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

// Public unauthenticated routes
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, internal next files, and cron jobs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const sessionResult = await verifySessionToken(token);

  const isPublicAuthRoute = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith("/api/");
  const isSessionCheckApi = pathname === "/api/auth/session";

  // Allow session check API to handle its own response
  if (isSessionCheckApi) {
    return NextResponse.next();
  }

  // 3. Handle Root Route (/)
  if (pathname === "/") {
    if (sessionResult.valid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      const redirectRes = NextResponse.redirect(new URL("/login", request.url));
      redirectRes.cookies.delete(AUTH_COOKIE_NAME);
      redirectRes.cookies.delete(LEGACY_COOKIE_NAME);
      return redirectRes;
    }
  }

  // 4. Handle Public Auth Routes (/login, /forgot-password, /reset-password)
  if (isPublicAuthRoute) {
    if (sessionResult.valid) {
      // User is already authenticated with a valid session -> redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Allow access to login/reset page
    return NextResponse.next();
  }

  // 5. Handle Protected Routes (All admin pages and protected APIs)
  if (!sessionResult.valid) {
    // Session is missing, invalid, idle-timed-out, or absolute-expired
    const reason = sessionResult.reason || "UNAUTHORIZED";

    if (isApiRoute) {
      const apiResponse = NextResponse.json(
        {
          error: "Unauthorized: Session has expired or is invalid. Please log in again.",
          code: reason,
        },
        { status: 401 }
      );
      apiResponse.cookies.delete(AUTH_COOKIE_NAME);
      apiResponse.cookies.delete(LEGACY_COOKIE_NAME);
      return apiResponse;
    }

    // Page route: redirect to /login with reason & redirect target
    const loginUrl = new URL("/login", request.url);
    if (reason === "EXPIRED_IDLE") {
      loginUrl.searchParams.set("reason", "idle");
    } else if (reason === "EXPIRED_ABSOLUTE") {
      loginUrl.searchParams.set("reason", "expired");
    } else {
      loginUrl.searchParams.set("reason", "unauthorized");
    }
    loginUrl.searchParams.set("redirect", pathname);

    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.cookies.delete(AUTH_COOKIE_NAME);
    redirectRes.cookies.delete(LEGACY_COOKIE_NAME);

    // Prevent caching of redirect response
    redirectRes.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    return redirectRes;
  }

  // 6. Session is VALID: Proceed with request and slide idle window
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", sessionResult.session.userId);
  requestHeaders.set("x-user-email", sessionResult.session.email);
  requestHeaders.set("x-user-role", sessionResult.session.roleName);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Strict anti-caching headers on all protected resources
  // (Crucial: prevents browser Back button from showing protected page content after logout)
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Slide idle window if more than 60 seconds have elapsed since last activity
  const now = Date.now();
  if (now - sessionResult.session.lastActivity > 60 * 1000) {
    const updatedPayload: SessionPayload = {
      ...sessionResult.session,
      lastActivity: now,
    };
    const refreshedToken = await signSessionToken(updatedPayload);

    response.cookies.set(AUTH_COOKIE_NAME, refreshedToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_ABSOLUTE_LIFETIME_MS / 1000),
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, logo
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
