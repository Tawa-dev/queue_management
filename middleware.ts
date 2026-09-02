import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Lightweight JWT-only middleware — avoids importing the full NextAuth bundle
// which exceeds Vercel's 1 MB Edge Function limit on the free tier.
// We decode the session token directly using jose (already a NextAuth dep).

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? ""
);

// NextAuth v5 stores the session in this cookie name
const SESSION_COOKIE = process.env.NODE_ENV === "production"
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as { role?: string; zoneId?: string; email?: string };
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isPublicRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/display") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/images") ||
    nextUrl.pathname === "/favicon.ico";

  if (isPublicRoute) return NextResponse.next();

  const session = await getSessionFromRequest(req);
  const isLoggedIn = !!session;
  const userRole = session?.role;

  // Redirect unauthenticated staff to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated staff away from /login to /queue
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/queue", nextUrl.origin));
  }

  // RBAC — admin-only routes
  const pathname = nextUrl.pathname;
  const isAdminRoute =
    pathname.startsWith("/patients") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  if (isAdminRoute && userRole !== "ADMIN") {
    const redirectUrl = new URL("/queue", nextUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      "UnauthorizedAccess: Admin privileges required."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // RBAC — rooms restricted to Doctor/Admin
  if (pathname.startsWith("/rooms") && userRole === "RECEPTIONIST") {
    const redirectUrl = new URL("/queue", nextUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      "UnauthorizedAccess: Room allocation restricted to Doctors and Admins."
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
