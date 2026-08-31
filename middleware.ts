import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role;

  const isPublicRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/display") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/images") ||
    nextUrl.pathname === "/favicon.ico";

  // Redirect unauthenticated staff attempting to reach protected routes
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated staff away from /login to /queue
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/queue", nextUrl.origin));
  }

  // Role-Based Access Control (RBAC) rules
  if (isLoggedIn && userRole) {
    const pathname = nextUrl.pathname;

    // Admin-only routes
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

    // Doctor/Nurse/Admin routes for /rooms
    const isRoomRoute = pathname.startsWith("/rooms");
    if (isRoomRoute && userRole === "RECEPTIONIST") {
      const redirectUrl = new URL("/queue", nextUrl.origin);
      redirectUrl.searchParams.set(
        "error",
        "UnauthorizedAccess: Room allocation restricted to Doctors and Admins."
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
